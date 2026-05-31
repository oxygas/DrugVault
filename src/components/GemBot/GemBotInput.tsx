'use client'

import { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
}

export function GemBotInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`
  }

  return (
    <div className="flex items-end gap-2 border-t border-[var(--border3)]/50 p-2.5 bg-[var(--bg2)]/30">
      <div className="flex-1 flex items-center rounded-xl border border-[var(--border2)] bg-[var(--bg2)]/60 has-[:focus]:border-[var(--accent)]/40 has-[:focus]:ring-1 has-[:focus]:ring-[var(--accent)]/20 has-[:focus]:shadow-[0_0_12px_rgba(192,132,252,0.08)] transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any substance..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text4)] outline-none disabled:opacity-50"
          style={{ fontSize: '16px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg mr-1.5 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          style={{
            background: value.trim() && !disabled
              ? 'linear-gradient(135deg, var(--accent), var(--pink))'
              : 'var(--text5)',
          }}
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
