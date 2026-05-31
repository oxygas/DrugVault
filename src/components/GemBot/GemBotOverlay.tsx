'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useGemBotStore } from '@/stores/gembot'
import { GemBotMessage } from './GemBotMessage'
import { GemBotInput } from './GemBotInput'

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%] sm:max-w-[90%] rounded-xl rounded-bl-md px-4 py-3 bg-[var(--bg3)]/80 border border-[var(--border2)]">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[var(--text4)] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="size-1.5 rounded-full bg-[var(--text4)] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="size-1.5 rounded-full bg-[var(--text4)] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

export function GemBotOverlay() {
  const { isOpen, messages, close, addMessage, appendToLastBotMessage, clearHistory } = useGemBotStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsLoading(false)
    setStreamingContent('')
    setError(null)
    close()
  }, [close])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, handleClose])

  const handleSend = useCallback(async (text: string) => {
    setError(null)
    setStreamingContent('')

    addMessage({ role: 'user', content: text })
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    const currentMessages = useGemBotStore.getState().messages
    const conversation = currentMessages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await fetch('/api/gembot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errData.error || `Error ${res.status}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response stream')

      let botContent = ''
      addMessage({ role: 'assistant', content: '' })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)

          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              throw new Error(parsed.error)
            }
            const raw = parsed.content
            if (typeof raw === 'string' && raw.length > 0) {
              botContent += raw
            }
          } catch {
            // skip non-json lines
          }
        }
      }

      if (botContent) {
        appendToLastBotMessage(botContent)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      addMessage({ role: 'assistant', content: `⚠️ Error: ${msg}` })
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      abortRef.current = null
    }
  }, [addMessage, appendToLastBotMessage])

  if (!isOpen) return null

  return (
    <div
      className="
        fixed z-[9998] flex flex-col
        inset-0
        sm:inset-auto sm:bottom-20 sm:left-4
        sm:w-[480px]
        sm:h-[min(700px,calc(100dvh-120px))]
      "
    >
      <div className="
        flex flex-col overflow-hidden flex-1
        sm:rounded-2xl sm:border sm:border-[var(--border2)]
        bg-[var(--surface-elevated)] sm:backdrop-blur-xl sm:shadow-2xl
        border-t border-[var(--border2)] sm:border-t-0
      ">
        <div className="flex items-center justify-between border-b border-[var(--border2)] px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--cyan)] shadow-[0_0_6px_var(--cyan)]" />
            <span className="font-mono text-sm font-semibold text-[var(--text)]">GemBot</span>
            <span className="hidden sm:inline text-[10px] font-mono text-[var(--text4)] ml-1">llama-3.3-70b</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearHistory}
              className="rounded-md px-2 py-1 text-xs text-[var(--text4)] hover:text-[var(--text3)] transition-colors"
              aria-label="Clear chat"
            >
              New Chat
            </button>
            <button
              onClick={handleClose}
              className="flex size-7 items-center justify-center rounded-md text-[var(--text4)] hover:text-[var(--text)] hover:bg-[var(--bg2)] transition-colors"
              aria-label="Close GemBot"
            >
              <X size={16} className="hidden sm:block" />
              <ChevronDown size={20} className="sm:hidden" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 scroll-smooth overscroll-contain">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <div className="mb-3 size-12 rounded-full bg-[var(--cyan)]/10 flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
              <p className="text-sm font-medium text-[var(--text2)]">Hi, I&apos;m GemBot!</p>
              <p className="mt-1 text-xs text-[var(--text4)] max-w-[280px] sm:max-w-[320px]">
                Ask me about any substance, check combinations, or get harm reduction info — I have data on 634 substances.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['What is MDMA?', 'LSD + cannabis', 'Compare stimulants'].map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="rounded-full border border-[var(--border2)] px-3 py-1.5 text-xs text-[var(--text3)] hover:text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <GemBotMessage key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <GemBotInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  )
}
