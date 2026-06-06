'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Message } from '@/stores/gembot'

interface Props {
  message: Message
  query?: string
  onFeedback?: (positive: boolean) => void
}

const COMBO_LEVEL_COLORS: Record<string, string> = {
  'Safe': '#22c55e',
  'Low Risk': '#06b6d4',
  'Caution': '#f59e0b',
  'Unsafe': '#f97316',
  'Dangerous': '#ef4444',
  'Deadly': '#b91c1c',
}

function HarmBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const color =
    pct <= 25 ? '#22c55e' :
    pct <= 50 ? '#eab308' :
    pct <= 75 ? '#f97316' : '#ef4444'

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-20 shrink-0 truncate text-[10px] font-mono text-[var(--text3)]">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-[var(--bg2)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[10px] font-mono text-[var(--text2)]">{value}</span>
    </div>
  )
}

function ComboCard({ subA, subB, level }: { subA: string; subB: string; level: string }) {
  const color = COMBO_LEVEL_COLORS[level] || '#94a3b8'

  return (
    <div className="my-2 rounded-lg border border-[var(--border2)] bg-[var(--bg2)]/60 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--text)]">
          {subA} <span className="text-[var(--text4)]">+</span> {subB}
        </span>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
        >
          {level}
        </span>
      </div>
    </div>
  )
}

const BAR_REGEX = /^(.+?)[:\s]+[█░]+.*?(\d+)\s*\/\s*100/gm
const COMBO_REGEX = /\[COMBO:\s*(.+?)\s*\+\s*(.+?)\s*→\s*(.+?)\]/gi

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as { props: { children?: React.ReactNode } }).props.children)
  }
  return ''
}

function parseVisuals(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  const allMatches: { index: number; length: number; node: React.ReactNode }[] = []

  for (const m of content.matchAll(BAR_REGEX)) {
    allMatches.push({
      index: m.index!,
      length: m[0].length,
      node: <HarmBar key={`bar-${m.index}`} label={m[1].trim()} value={parseInt(m[2], 10)} />,
    })
  }

  for (const m of content.matchAll(COMBO_REGEX)) {
    allMatches.push({
      index: m.index!,
      length: m[0].length,
      node: <ComboCard key={`combo-${m.index}`} subA={m[1].trim()} subB={m[2].trim()} level={m[3].trim()} />,
    })
  }

  allMatches.sort((a, b) => a.index - b.index)

  for (const match of allMatches) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    parts.push(match.node)
    lastIndex = match.index + match.length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [content]
}

export function GemBotMessage({ message, query, onFeedback }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-3 gemot-msg-enter">
        <div className="max-w-[85%] sm:max-w-[90%] rounded-md px-4 py-2.5 text-sm leading-relaxed bg-gradient-to-br from-[var(--accent)]/30 to-[var(--pink)]/20 text-[var(--text)] border border-[var(--accent)]/40 shadow-sm">
          <p className="whitespace-pre-wrap break-words max-w-full">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-3 gemot-msg-enter">
      <div className="max-w-[85%] sm:max-w-[90%] rounded-md px-4 py-2.5 text-sm leading-relaxed bg-[var(--bg3)]/95 text-[var(--text)] border border-[var(--border2)] border-l-4 border-l-[var(--accent)] shadow-sm">
        <div className="prose prose-sm prose-invert max-w-none
          prose-p:my-1 prose-ul:my-1 prose-li:my-0.5
          prose-code:text-[var(--cyan)] prose-code:bg-[var(--bg2)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:break-all
          prose-strong:text-[var(--accent)] prose-em:text-[var(--text)]
          prose-headings:text-[var(--text)] prose-headings:font-semibold
          prose-table:text-xs prose-table:my-2
          prose-table:w-full prose-table:max-w-full prose-table:block prose-table:overflow-x-auto
          prose-thead:border-b prose-thead:border-[var(--border2)]
          prose-th:text-[var(--accent)] prose-th:pr-3 prose-th:whitespace-nowrap
          prose-td:pr-3 prose-td:border-r prose-td:border-[var(--border2)]/50 prose-td:whitespace-nowrap
          prose-tr:border-b prose-tr:border-[var(--border2)]/30
          break-words"
          style={{ color: 'var(--text)' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => {
                const text = extractText(children)
                const visuals = parseVisuals(text)
                const hasVisuals = visuals.some(v => typeof v !== 'string')
                return <p className="my-1">{hasVisuals ? visuals : children}</p>
              },
              code: ({ children, className }) => {
                const isInline = !className
                if (isInline) {
                  return <code className="text-[var(--cyan)] bg-[var(--bg2)] px-1 py-0.5 rounded text-xs">{children}</code>
                }
                return <code className="block bg-[var(--bg2)] p-2 rounded-lg overflow-x-auto text-xs">{children}</code>
              },
              td: ({ children }) => <td className="pr-3 border-r border-[var(--border2)]/50 whitespace-nowrap">{children}</td>,
              th: ({ children }) => <th className="pr-3 text-[var(--accent)] whitespace-nowrap">{children}</th>,
              tr: ({ children }) => <tr className="border-b border-[var(--border2)]/30">{children}</tr>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {query && onFeedback && (
          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-[var(--border2)]/30">
            <span className="text-[10px] text-[var(--text4)]">Helpful?</span>
            <button
              onClick={() => onFeedback(true)}
              className="flex items-center justify-center size-6 rounded text-[var(--text4)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
              aria-label="Thumbs up"
            >
              <ThumbsUp size={12} />
            </button>
            <button
              onClick={() => onFeedback(false)}
              className="flex items-center justify-center size-6 rounded text-[var(--text4)] hover:text-[var(--pink)] hover:bg-[var(--pink)]/10 transition-colors"
              aria-label="Thumbs down"
            >
              <ThumbsDown size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
