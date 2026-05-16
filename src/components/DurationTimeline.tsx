'use client'

import type { Substance } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'

interface DurationTimelineProps {
  substance: Substance
}

const SEGMENT_COLORS = [
  { key: 'onset', label: 'Onset', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.35)' },
  { key: 'comeup', label: 'Come Up', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.3)' },
  { key: 'peak', label: 'Peak', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.3)' },
  { key: 'offset', label: 'Offset', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.25)' },
  { key: 'after', label: 'After', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
]

interface Seg { label: string; minutes: number; color: string; bg: string }

function parseDurationToMinutes(dur: string): number {
  if (!dur) return 0
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
  return total || 120
}

function buildSegments(substance: Substance): Seg[] {
  const roas = substance.pwRoas
  if (!roas || roas.length === 0) {
    const total = parseDurationToMinutes(substance.duration)
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
    if (roa.dur.o) segs.push({ label: 'Onset', minutes: parseDurationToMinutes(roa.dur.o), color: SEGMENT_COLORS[0].color, bg: SEGMENT_COLORS[0].bg })
    if (roa.dur.p) segs.push({ label: 'Peak', minutes: parseDurationToMinutes(roa.dur.p), color: SEGMENT_COLORS[2].color, bg: SEGMENT_COLORS[2].bg })
    if (roa.dur.t) {
      const offsetAndAfter = parseDurationToMinutes(roa.dur.t) - segs.reduce((s, seg) => s + seg.minutes, 0)
      if (offsetAndAfter > 0) {
        segs.push({ label: 'Offset', minutes: offsetAndAfter * 0.6, color: SEGMENT_COLORS[3].color, bg: SEGMENT_COLORS[3].bg })
        segs.push({ label: 'After', minutes: offsetAndAfter * 0.4, color: SEGMENT_COLORS[4].color, bg: SEGMENT_COLORS[4].bg })
      }
    }
  }
  return segs.length > 0 ? segs : [{ label: 'Total', minutes: 120, color: SEGMENT_COLORS[2].color, bg: SEGMENT_COLORS[2].bg }]
}

export default function DurationTimeline({ substance }: DurationTimelineProps) {
  const segments = buildSegments(substance)
  const total = segments.reduce((s, seg) => s + seg.minutes, 0)
  const catColor = CATEGORY_COLORS[substance.category]

  return (
    <div className="w-full">
    <h4 className="text-xs lg:text-sm font-semibold text-[var(--text2)] mb-3 flex items-center gap-2 font-display">
      <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full" style={{ background: catColor, boxShadow: `0 0 6px ${catColor}40` }} />
      Duration Timeline
    </h4>
      <div className="timeline-bar w-full rounded-lg overflow-hidden">
        {segments.map((seg, i) => {
          const pct = (seg.minutes / total) * 100
          const left = segments.slice(0, i).reduce((s, s2) => s + (s2.minutes / total) * 100, 0)
          return (
            <div
              key={seg.label}
              className="timeline-segment group/seg"
              style={{ left: `${left}%`, width: `${pct}%`, background: seg.bg, borderColor: `${seg.color}30` }}
            >
              <span className="hidden sm:inline truncate px-1.5 font-display text-[10px] font-medium" style={{ color: seg.color }}>{seg.label}</span>
              <span className="sm:hidden text-[7px] truncate px-0.5 font-mono" style={{ color: seg.color }}>{seg.label.slice(0, 3)}</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg glass-strong text-[10px] text-white whitespace-nowrap opacity-0 group-hover/seg:opacity-100 transition-opacity pointer-events-none z-10 font-mono shadow-xl border border-[var(--border2)]">
                <span style={{ color: seg.color }}>{seg.label}</span>: ~{Math.round(seg.minutes)}min
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color, boxShadow: `0 0 4px ${seg.color}40` }} />
            <span className="text-[10px] text-[var(--text4)]">{seg.label}</span>
            <span className="text-[10px] font-mono" style={{ color: seg.color }}>~{Math.round(seg.minutes)}m</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs lg:text-sm text-[var(--text3)] font-mono flex items-center gap-1.5">
        <span className="text-[var(--text2)] font-semibold">{substance.onset}</span> onset
        <span className="text-[var(--border2)] mx-1">·</span>
        <span className="text-[var(--text2)] font-semibold">{substance.duration}</span> total
      </div>
    </div>
  )
}
