'use client'

import type { Substance } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'

interface DurationTimelineProps {
  substance: Substance
}

const SEGMENT_COLORS = [
  { key: 'onset', label: 'Onset', color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.2)' },
  { key: 'comeup', label: 'Come Up', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.18)' },
  { key: 'peak', label: 'Peak', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.18)' },
  { key: 'offset', label: 'Offset', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
  { key: 'after', label: 'After', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' },
]

interface Seg { label: string; minutes: number; color: string; bg: string }

function parseDurationToMinutes(dur: string): number {
  if (!dur || dur.toLowerCase().startsWith('null')) return 0
  const lower = dur.toLowerCase()
  const hours = lower.match(/(\d+\.?\d*)\s*h/)
  const mins = lower.match(/(\d+)\s*min/)
  let total = 0
  if (hours) total += parseFloat(hours[1]) * 60
  if (mins) total += parseInt(mins[1])
  if (!hours && !mins) {
    const nums = lower.match(/(\d+)/g)
    if (nums) total = parseInt(nums[0]) * 60
  }
  return total || 0
}

function buildSegments(substance: Substance): Seg[] {
  const roas = substance.pwRoas
  if (!roas || roas.length === 0) {
    const total = parseDurationToMinutes(substance.duration)
    if (total === 0) return []
    const onset = parseDurationToMinutes(substance.onset) || total * 0.1
    return [
      { label: 'Onset', minutes: onset, color: SEGMENT_COLORS[0].color, bg: SEGMENT_COLORS[0].bg },
      { label: 'Peak', minutes: total * 0.4, color: SEGMENT_COLORS[2].color, bg: SEGMENT_COLORS[2].bg },
      { label: 'Offset', minutes: total * 0.3, color: SEGMENT_COLORS[3].color, bg: SEGMENT_COLORS[3].bg },
      { label: 'After', minutes: total * 0.2, color: SEGMENT_COLORS[4].color, bg: SEGMENT_COLORS[4].bg },
    ]
  }
  const roa = roas[0]
  const segs: Seg[] = []
  if (roa.dur) {
    if (roa.dur.o) {
      const onsetMin = parseDurationToMinutes(roa.dur.o)
      if (onsetMin > 0) segs.push({ label: 'Onset', minutes: onsetMin, color: SEGMENT_COLORS[0].color, bg: SEGMENT_COLORS[0].bg })
    }
    if (roa.dur.p) {
      const peakMin = parseDurationToMinutes(roa.dur.p)
      if (peakMin > 0) segs.push({ label: 'Peak', minutes: peakMin, color: SEGMENT_COLORS[2].color, bg: SEGMENT_COLORS[2].bg })
    }
    if (roa.dur.t) {
      const totalMin = parseDurationToMinutes(roa.dur.t)
      if (totalMin > 0) {
        const offsetAndAfter = totalMin - segs.reduce((s, seg) => s + seg.minutes, 0)
        if (offsetAndAfter > 0) {
          segs.push({ label: 'Offset', minutes: offsetAndAfter * 0.6, color: SEGMENT_COLORS[3].color, bg: SEGMENT_COLORS[3].bg })
          segs.push({ label: 'After', minutes: offsetAndAfter * 0.4, color: SEGMENT_COLORS[4].color, bg: SEGMENT_COLORS[4].bg })
        }
      }
    }
  }
  return segs
}

export default function DurationTimeline({ substance }: DurationTimelineProps) {
  const segments = buildSegments(substance)
  if (segments.length === 0) return null
  const total = segments.reduce((s, seg) => s + seg.minutes, 0)
  const catColor = CATEGORY_COLORS[substance.category]

  return (
    <div className="w-full">
      <h4 className="text-xs lg:text-sm font-semibold text-[var(--text2)] mb-3 flex items-center gap-2 font-display">
        <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full" style={{ background: catColor, boxShadow: `0 0 6px ${catColor}40` }} />
        Duration Timeline
      </h4>

      <div className="timeline-bar w-full">
        {segments.map((seg, i) => {
          const pct = (seg.minutes / total) * 100
          const isFirst = i === 0
          const isLast = i === segments.length - 1
          return (
            <div
              key={seg.label}
              className="timeline-segment group/seg"
              style={{
                width: `${pct}%`,
                background: seg.bg,
                borderColor: `${seg.color}20`,
                borderRadius: isFirst ? '999px 0 0 999px' : isLast ? '0 999px 999px 0' : '0',
              }}
            >
              <span className="timeline-seg-label text-[10px] font-medium truncate px-1.5" style={{ color: seg.color }}>
                {seg.label}
              </span>
              <div className="timeline-seg-tooltip">
                <span style={{ color: seg.color }}>{seg.label}</span>: ~{Math.round(seg.minutes)}min
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
            <span className="text-[11px] text-[var(--text4)]">{seg.label}</span>
            <span className="text-[11px] font-mono" style={{ color: seg.color }}>~{Math.round(seg.minutes)}m</span>
          </div>
        ))}
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text3)] font-mono">
        <span className="text-[var(--text2)] font-semibold">{substance.onset}</span>
        <span className="text-[var(--border2)]">/</span>
        <span className="text-[var(--text2)] font-semibold">{substance.duration}</span>
        <span className="text-[var(--text4)]">total</span>
      </div>
    </div>
  )
}
