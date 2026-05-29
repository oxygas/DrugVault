'use client'

import { useState, useMemo } from 'react'
import type { Substance } from '@/lib/types'
import legalData from '@/data/legal-status.json'
import { useGeo } from '@/lib/geo'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function lookupStatus(substance: Substance, countryCode: string): string | undefined {
  const slug = slugify(substance.name)
  const overrides = legalData.overrides as Record<string, Record<string, string>>
  if (overrides[slug]?.[countryCode]) return overrides[slug][countryCode]
  const cats = legalData.categories as Record<string, Record<string, string>>
  return cats[substance.category]?.[countryCode]
}

function lookupStateStatus(substance: Substance, stateCode: string): string | undefined {
  const slug = slugify(substance.name)
  const stateOverrides = legalData.usStateOverrides as Record<string, Record<string, string>>
  if (stateOverrides[slug]?.[stateCode]) return stateOverrides[slug][stateCode]
  const stateDefaults = legalData.usStateDefaults as Record<string, Record<string, string>>
  return stateDefaults[stateCode]?.[substance.category]
}

function statusColor(status: string): string {
  const lower = status.toLowerCase()
  const green = /^(legal|decriminalized|tolerated|unregulated)/
  const amber = /^(prescription|controlled|schedule|class|medical|narcotic|regulated|age restricted)/
  const red = /^(illegal|prohibited|stupéfiant)/
  if (green.test(lower)) return '#4ade80'
  if (red.test(lower)) return '#ef4444'
  if (amber.test(lower)) return '#fbbf24'
  return '#a78bfa'
}

function getStatusTier(status: string): 'green' | 'amber' | 'red' {
  const lower = status.toLowerCase()
  if (/^(legal|decriminalized|tolerated|unregulated)/.test(lower)) return 'green'
  if (/^(illegal|prohibited|stupéfiant)/.test(lower)) return 'red'
  return 'amber'
}

function StateFlag({ code, color }: { code: string; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-4 rounded-sm text-[7px] font-mono font-bold text-white flex-shrink-0"
      style={{ background: color, boxShadow: `0 0 4px ${color}40`, letterSpacing: '0.03em' }}
    >
      {code}
    </span>
  )
}

function StatusCard({
  flag,
  label,
  status,
  statusNote,
  isState,
  stateCode,
}: {
  flag: string
  label: string
  status: string | undefined
  statusNote?: string
  isState: boolean
  stateCode?: string
}) {
  const tier = status ? getStatusTier(status) : 'amber'
  const sc = status ? statusColor(status) : 'var(--text4)'
  const note = statusNote

  return (
    <div
      className={`vaporwave-status-card ${isState ? 'state-card' : ''}`}
      style={{ '--tube-c': sc } as React.CSSProperties}
    >
      <div className="neon-stripe" style={{ background: sc }} />
      <div className="diagonal-shine" />
      <div className="flex items-center gap-2.5 relative z-[1]">
          {isState && stateCode ? <StateFlag code={stateCode} color={flag} /> : <span className="text-lg flex-shrink-0">{flag}</span>}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-mono text-[var(--text4)] mb-0.5">{label}</div>
          <div
            className="status-label text-sm font-semibold font-display"
            style={{ color: status ? sc : 'var(--text3)' }}
          >
            {status || 'Unknown / No data'}
          </div>
          {note && (
            <div className="text-[10px] font-mono text-[var(--text5)] mt-0.5">{note}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LegalStatusTabContent({
  substance,
  catColor,
}: {
  substance: Substance
  catColor: string
}) {
  const geo = useGeo()
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedState, setSelectedState] = useState('')

  const effectiveCountry = selectedCountry || geo.countryCode || ''
  const effectiveState = selectedState || (effectiveCountry === 'US' ? geo.stateCode || '' : '')
  const isUS = effectiveCountry === 'US'

  const countryData = legalData.countries.find(c => c.code === effectiveCountry)
  const federalStatus = effectiveCountry ? lookupStatus(substance, effectiveCountry) : undefined
  const stateInfo = legalData.usStates.find(s => s.code === effectiveState)
  const stateStatus = effectiveState && isUS ? lookupStateStatus(substance, effectiveState) : undefined

  const countryButtons = useMemo(() =>
    legalData.countries.map((c, i) => (
      <button
        key={c.code}
        onClick={() => { setSelectedCountry(c.code); setSelectedState('') }}
        className={`country-pill ${effectiveCountry === c.code ? 'active' : ''}`}
        style={{
          ...(effectiveCountry === c.code ? {
            '--pill-glow': `${catColor}30`,
            '--pill-border': `${catColor}60`,
            '--pill-bg': `${catColor}12`,
          } as React.CSSProperties : {}),
          animationDelay: `${i * 40}ms`,
        }}
      >
        <span className="country-flag">{c.flag}</span>
        <span className="country-code">{c.code}</span>
      </button>
    )),
  [effectiveCountry, catColor])

  const stateButtons = useMemo(() =>
    legalData.usStates.map((s, i) => (
      <button
        key={s.code}
        onClick={() => setSelectedState(s.code)}
        className={`state-pill ${effectiveState === s.code ? 'active' : ''}`}
        style={{
          '--state-color': s.flag,
          borderLeft: `3px solid ${s.flag}`,
          ...(effectiveState === s.code ? {
            '--pill-glow': `${catColor}30`,
            '--pill-border': `${catColor}60`,
            '--pill-bg': `${catColor}12`,
          } as React.CSSProperties : {}),
          animationDelay: `${i * 30}ms`,
        } as React.CSSProperties}
      >
        {s.code}
      </button>
    )),
  [effectiveState, catColor])

  return (
    <div className="legal-status-tab space-y-5">
      <div className="section-anim" style={{ animationDelay: '0ms' }}>
        <h4 className="text-sm font-semibold mb-2.5 font-display text-[var(--text2)] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor, boxShadow: `0 0 6px ${catColor}` }} />
          Select Jurisdiction
        </h4>
        <div className="flex flex-wrap gap-2">{countryButtons}</div>
      </div>

      {isUS && (
        <div className="section-anim" style={{ animationDelay: '100ms' }}>
          <h4 className="text-sm font-semibold mb-2.5 font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor, boxShadow: `0 0 6px ${catColor}` }} />
            US State
          </h4>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto state-grid">{stateButtons}</div>
        </div>
      )}

      {effectiveCountry && (
        <div className="space-y-3 section-anim" style={{ animationDelay: isUS ? '200ms' : '100ms' }}>
          <h4 className="text-sm font-semibold font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor, boxShadow: `0 0 6px ${catColor}` }} />
            Legal Status
          </h4>

          <StatusCard
            flag={countryData?.flag || '🏳️'}
            label={isUS ? 'Federal (US)' : countryData?.name || effectiveCountry}
            status={federalStatus}
            isState={false}
          />

      {effectiveState && (
          <StatusCard
            flag={stateInfo?.flag || '#003F87'}
            label={`${stateInfo?.name || effectiveState}`}
            status={stateStatus || federalStatus}
            statusNote={!stateStatus ? 'Follows federal law — no additional state controls' : undefined}
            isState
            stateCode={stateInfo?.code || effectiveState}
          />
        )}
        </div>
      )}

      <div className="section-anim" style={{ animationDelay: '400ms' }}>
        <div className="disclaimer-card">
          <div className="relative z-[1] flex items-start gap-2.5">
            <span className="text-base flex-shrink-0">⚖️</span>
            <p className="text-[11px] text-[var(--text4)] leading-relaxed">
              Legal status information is for educational purposes only and may not reflect
              the most current laws. Always consult a qualified legal professional for advice.
              Laws vary by jurisdiction and change frequently.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
