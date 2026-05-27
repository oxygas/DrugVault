'use client'

import { useState } from 'react'
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

  const countryData = legalData.countries.find(c => c.code === effectiveCountry)
  const federalStatus = effectiveCountry ? lookupStatus(substance, effectiveCountry) : undefined

  const isUS = effectiveCountry === 'US'
  const stateInfo = legalData.usStates.find(s => s.code === effectiveState)
  const stateStatus = effectiveState && isUS ? lookupStateStatus(substance, effectiveState) : undefined

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-semibold mb-2.5 font-display text-[var(--text2)] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
          Select Jurisdiction
        </h4>
        <div className="flex flex-wrap gap-2">
          {legalData.countries.map(c => (
            <button
              key={c.code}
              onClick={() => { setSelectedCountry(c.code); setSelectedState('') }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                effectiveCountry === c.code
                  ? 'border-[var(--accent)] bg-[rgba(168,85,247,0.1)] text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[rgba(255,255,255,0.02)] text-[var(--text3)] hover:text-[var(--text2)] hover:border-[var(--text4)]'
              }`}
            >
              {c.flag} {c.code}
            </button>
          ))}
        </div>
      </div>

      {isUS && (
        <div>
          <h4 className="text-sm font-semibold mb-2.5 font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
            US State
          </h4>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {legalData.usStates.map(s => (
              <button
                key={s.code}
                onClick={() => setSelectedState(s.code)}
                className={`px-2 py-1 rounded text-[10px] font-mono transition-all border ${
                  effectiveState === s.code
                    ? 'border-[var(--accent)] bg-[rgba(168,85,247,0.1)] text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[rgba(255,255,255,0.02)] text-[var(--text4)] hover:text-[var(--text3)]'
                }`}
              >
                {s.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {effectiveCountry && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold font-display text-[var(--text2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
            Legal Status
          </h4>

          <div
            className="p-3 rounded-lg border"
            style={{
              borderColor: federalStatus ? `${statusColor(federalStatus)}25` : 'var(--border)',
              background: federalStatus ? `${statusColor(federalStatus)}08` : 'rgba(255,255,255,0.02)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{countryData?.flag || '🏳️'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono text-[var(--text4)] mb-0.5">
                  {isUS ? 'Federal (US)' : countryData?.name || effectiveCountry}
                </div>
                <div className="text-sm font-semibold font-display" style={{ color: federalStatus ? statusColor(federalStatus) : 'var(--text3)' }}>
                  {federalStatus || 'Unknown / No data'}
                </div>
              </div>
            </div>
          </div>

          {effectiveState && (
            <div
              className="p-3 rounded-lg border"
              style={{
                borderColor: stateStatus ? `${statusColor(stateStatus)}25` : 'var(--border)',
                background: stateStatus ? `${statusColor(stateStatus)}08` : 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{stateInfo?.flag || '🇺🇸'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono text-[var(--text4)] mb-0.5">
                    State ({stateInfo?.code || effectiveState})
                  </div>
                  <div className="text-sm font-semibold font-display" style={{ color: stateStatus ? statusColor(stateStatus) : 'var(--text3)' }}>
                    {stateStatus || federalStatus || 'Unknown / No data'}
                  </div>
                  {!stateStatus && (
                    <div className="text-[10px] font-mono text-[var(--text5)] mt-0.5">
                      Follows federal law — no additional state controls
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--border)]">
        <p className="text-[11px] text-[var(--text4)] leading-relaxed">
          ⚖️ Legal status information is for educational purposes only and may not reflect
          the most current laws. Always consult a qualified legal professional for advice.
          Laws vary by jurisdiction and change frequently.
        </p>
      </div>
    </div>
  )
}
