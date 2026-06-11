import { NextRequest } from 'next/server'
import { buildSystemPrompt, enrichQueryWithSubstanceData, isGreeting } from '@/lib/gembot-prompt'
import { getAllSubstances, getComboMatrix } from '@/lib/data'

export const dynamic = 'force-dynamic'

let cachedSystemPrompt = ''

// In-memory cache with TTL expiration (replaces lru-cache which broke Turbopack bundling)
class SimpleCache<K, V> {
  private cache = new Map<K, { value: V; expiresAt: number }>()
  private readonly defaultTtl: number
  private readonly maxSize: number

  constructor(options: { max: number; ttl?: number }) {
    this.maxSize = options.max
    this.defaultTtl = options.ttl ?? 60_000
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) this.cache.delete(firstKey)
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.defaultTtl })
  }

  has(key: K): boolean {
    return this.get(key) !== undefined
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }
}

// In-process cache; rate limiter resets on cold start (Vercel serverless).
// For production with multiple instances, use Vercel KV or similar external store.
const rateLimit = new SimpleCache<string, { count: number; resetAt: number }>({
  max: 1000,
  ttl: 60_000,
})

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  const windowMs = 60_000
  const maxRequests = 15

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  rateLimit.set(ip, entry)
  return { allowed: true, remaining: maxRequests - entry.count }
}

const NIM_BASE = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
const NIM_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
  const { allowed, remaining } = checkRateLimit(ip)

  if (!allowed) {
    return Response.json(
      { error: 'rate_limited', message: 'Too many requests. Please wait a minute.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  try {
    const body = await req.json()
    const { message, conversation } = body as {
      message: string
      conversation?: { role: string; content: string }[]
    }

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'bad_request', message: 'Message is required' }, { status: 400 })
    }

    if (isGreeting(message)) {
      const encoder = new TextEncoder()
      const greeting = "Hey there! I'm GemBot — ask me about any substance, check combos, or compare effects. What can I help you with?"
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: ' + JSON.stringify({ content: greeting }) + '\n\n'))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      })
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-RateLimit-Remaining': String(remaining),
        },
      })
    }

    const enrichment = await enrichQueryWithSubstanceData(message)

    if (!cachedSystemPrompt) {
      const allSubstances = await getAllSubstances()
      const matrix = await getComboMatrix()

      const substancesIndex = allSubstances
        .map(s => `${s.name} | ${s.category} | Harm:${s.harmScore}/100 | Addiction:${s.addictionScore}/100 | OD:${s.odRisk}/100`)
        .join('\n')

      const matrixIndex = Object.entries(matrix)
        .map(([key, val]) => `${key.replace('+', ' + ')} -> ${val}`)
        .join('\n')

      cachedSystemPrompt = buildSystemPrompt(substancesIndex, matrixIndex)
    }

    const systemPrompt = cachedSystemPrompt

    const systemContent = enrichment.contextBlock
      ? `${systemPrompt}\n\n${enrichment.contextBlock}`
      : systemPrompt

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemContent },
    ]

    if (conversation && Array.isArray(conversation)) {
      for (const msg of conversation) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content })
        }
      }
    }

    const userIndex = messages.findLastIndex(m => m.role === 'user')
    if (userIndex >= 0) {
      messages.splice(userIndex, 1, { role: 'user', content: message })
    } else {
      messages.push({ role: 'user', content: message })
    }

    const apiKey = process.env.NVIDIA_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'config_error', message: 'GemBot is not configured yet.' }, { status: 500 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    const longQuery = /compare|difference|versus|vs\.?|both|and|mix|combination/i.test(message) && message.split(/\s+/).length > 4

    const nimRes = await fetch(`${NIM_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NIM_MODEL,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: longQuery ? 1000 : 600,
        top_p: 0.95,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!nimRes.ok) {
      const errBody = await nimRes.text().catch(() => '')
      return Response.json(
        { error: 'upstream_failed', message: `NVIDIA API error: ${nimRes.status}` },
        { status: 502 }
      )
    }

    const encoder = new TextEncoder()
    const reader = nimRes.body?.getReader()
    if (!reader) {
      return Response.json({ error: 'stream_error', message: 'No response stream' }, { status: 502 })
    }

    const decoder = new TextDecoder()
    let buffer = ''

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              if (buffer.trim()) {
                controller.enqueue(encoder.encode(`data: ${buffer}\n\n`))
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith('data: ')) continue

              const data = trimmed.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const delta = parsed?.choices?.[0]?.delta
                if (delta && typeof delta.content === 'string' && delta.content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`))
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'stream_error' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Remaining': String(remaining),
      },
    })
  } catch (err) {
    console.error('GemBot handler error:', err)
    return Response.json(
      { error: 'internal', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
