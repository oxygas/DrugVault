'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { X, ChevronDown, Sparkles } from 'lucide-react'
import { useGemBotStore } from '@/stores/gembot'
import { useAnalytics } from '@/lib/use-analytics'
import { useScrollLock } from '@/lib/use-scroll-lock'
import { GemBotMessage } from './GemBotMessage'
import { GemBotInput } from './GemBotInput'

function LogoImg({ className }: { className?: string }) {
  return (
    <img
      src="/og-image.gif"
      alt="TripGem logo"
      className={className}
      style={{ filter: 'drop-shadow(0 0 8px rgba(var(--accent-rgb),0.4))' }}
    />
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3 gemot-msg-enter">
      <div className="max-w-[85%] sm:max-w-[90%] rounded-xl rounded-bl-md px-4 py-3 bg-[var(--bg3)]/80 border border-[var(--border2)] border-l-[var(--cyan)]/40 border-l-2">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[var(--cyan)] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="size-1.5 rounded-full bg-[var(--cyan)] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="size-1.5 rounded-full bg-[var(--cyan)] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

export function GemBotOverlay() {
  const { isOpen, messages, close, addMessage, appendToLastBotMessage, clearHistory } = useGemBotStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastQueryRef = useRef('')
  const { trackQuery, trackFeedback } = useAnalytics()

  const handleClose = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsLoading(false)
    setError(null)
    close()
  }, [close])

  const scrollToBottom = useCallback((instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom(isLoading)
  }, [messages, isLoading, scrollToBottom])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, handleClose])

  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    if (!matchMedia('(pointer: coarse)').matches) return
    const vv = window.visualViewport
    if (!vv) return

    let ticking = false
    const update = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const el = overlayRef.current
          if (el && vv) {
            el.style.height = `${vv.height}px`
            el.style.top = `${vv.offsetTop}px`
          }
          ticking = false
        })
        ticking = true
      }
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [isOpen])

  const handleSend = useCallback(async (text: string) => {
    setError(null)
    lastQueryRef.current = text

    addMessage({ role: 'user', content: text })
    setIsLoading(true)
    trackQuery(text)

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

      let hasContent = false
      let buffer = ''
      let rafId = 0
      addMessage({ role: 'assistant', content: '' })

      const flush = () => {
        if (buffer) {
          appendToLastBotMessage(buffer)
          buffer = ''
        }
      }

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
              if (!hasContent) {
                hasContent = true
                setIsLoading(false)
              }
              buffer += raw
              if (!rafId) {
                rafId = requestAnimationFrame(() => {
                  rafId = 0
                  flush()
                })
              }
            }
          } catch {
            // skip non-json lines
          }
        }
      }

      cancelAnimationFrame(rafId)
      flush()

      if (hasContent) {
        fetch('/api/gembot/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gap: text }),
          keepalive: true,
        }).catch(() => {})
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      addMessage({ role: 'assistant', content: `⚠️ Error: ${msg}` })
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [addMessage, appendToLastBotMessage, trackQuery])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="
        fixed z-[9998] flex flex-col
        inset-0
        sm:inset-auto sm:bottom-20 sm:left-4
        sm:w-[480px]
        sm:h-[min(700px,calc(100dvh-120px))]
        gemot-overlay-enter
        overscroll-contain
      "
    >
      <div className="
        flex flex-col overflow-hidden flex-1
        sm:rounded-2xl sm:border sm:border-[var(--border2)]
        bg-[var(--surface-elevated)] sm:backdrop-blur-xl sm:shadow-2xl
        border-t border-[var(--border2)] sm:border-t-0
      ">
        <div className="flex items-center justify-between border-b border-[var(--border3)]/50 px-3 py-2.5 shrink-0 bg-[var(--bg2)]/40">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-[var(--accent)]/20 to-[var(--pink)]/20 border border-[var(--accent)]/20">
              <LogoImg className="size-6 rounded-md" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none bg-gradient-to-r from-[var(--accent)] to-[var(--pink)] bg-clip-text text-transparent">
                TripGem
              </span>
              <span className="text-[10px] font-mono text-[var(--text4)] leading-tight mt-0.5 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[var(--cyan)] shadow-[0_0_4px_var(--cyan)] inline-block" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                <span className="lowercase">llama-3.3-70b</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-[var(--text4)] hover:text-[var(--text3)] hover:bg-[var(--bg2)]/60 transition-all"
              aria-label="Clear chat"
            >
              <Sparkles size={12} />
              New Chat
            </button>
            <button
              onClick={handleClose}
              className="flex size-7 items-center justify-center rounded-md text-[var(--text4)] hover:text-[var(--text)] hover:bg-[var(--bg2)]/60 transition-all"
              aria-label="Close GemBot"
            >
              <X size={16} className="hidden sm:block" />
              <ChevronDown size={20} className="sm:hidden" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 overscroll-contain gemot-scrollbar gemot-scroll-area">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center px-6">
              <div className="mb-4 flex items-center justify-center">
                <LogoImg className="size-16 rounded-lg" />
              </div>
              <p className="text-sm font-semibold text-[var(--text2)]">
                Hi, I&apos;m GemBot
              </p>
              <p className="mt-1.5 text-xs text-[var(--text4)] leading-relaxed max-w-[280px] sm:max-w-[320px]">
                Your harm reduction guide. Ask me about any substance, check combos, or compare effects — I have data on <span className="text-[var(--text3)] font-medium">634 substances</span>.
              </p>

              <div className="mt-5 flex flex-col gap-2 w-full max-w-[260px]">
                {[
                  { q: 'What is MDMA?', desc: 'Get harm profile & effects' },
                  { q: 'LSD + cannabis', desc: 'Check combination safety' },
                  { q: 'Compare stimulants', desc: 'Compare across substances' },
                ].map(({ q, desc }) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="group flex items-center justify-between gap-2 rounded-xl border border-[var(--border2)] px-4 py-2.5 text-left transition-all hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-[var(--text2)] group-hover:text-[var(--text)] transition-colors">{q}</span>
                      <span className="text-[10px] text-[var(--text4)]">{desc}</span>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text4)] group-hover:text-[var(--accent)] shrink-0 transition-colors">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col">
            {messages.map((msg, idx) => {
              const userQuery = msg.role === 'assistant'
                ? [...messages].slice(0, idx).reverse().find(m => m.role === 'user')?.content
                : undefined
              return (
                <GemBotMessage
                  key={msg.id}
                  message={msg}
                  query={userQuery}
                  onFeedback={userQuery ? (positive) => trackFeedback(userQuery, positive) : undefined}
                />
              )
            })}
            {isLoading && <TypingIndicator />}
          </div>
          <div ref={messagesEndRef} />
        </div>

        <GemBotInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  )
}
