'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Substance } from '@/lib/types'
import legalData from '@/data/legal-status.json'
import { useGeo } from '@/lib/geo'
import { StateFlagSvg } from '@/lib/state-flags'
import { CountryFlagSvg } from '@/lib/country-flags'

type Step = 'country' | 'state' | 'result'

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
  const decrim = (legalData as { usStateDecrim?: Record<string, Record<string, string>> }).usStateDecrim
  return decrim?.[slug]?.[stateCode]
}

function findTier(scheduleMap: { tiers: { tier: string; color: string; description: string }[] } | undefined, status: string | undefined) {
  if (!scheduleMap || !status) return null
  const primary = status.split('/')[0].trim()
  for (const t of scheduleMap.tiers) {
    if (primary.toLowerCase() === t.tier.toLowerCase()) return t
  }
  for (const t of scheduleMap.tiers) {
    if (primary.toLowerCase().startsWith(t.tier.toLowerCase().split(' ')[0])) return t
  }
  return null
}

function tierColor(scheduleMap: { tiers: { tier: string; color: string; description: string }[] } | undefined, status: string | undefined): string {
  const t = findTier(scheduleMap, status)
  if (t) return t.color
  const primary = (status || '').toLowerCase()
  if (primary.includes('illegal') || primary.includes('prohibited') || primary.includes('narcotic') || primary.includes('stupéfiant')) return '#ef4444'
  if (primary.includes('decrim') || primary.includes('tolerated')) return '#2dd4bf'
  if (primary.includes('medical')) return '#60a5fa'
  if (primary.includes('legal') || primary.includes('unregulated') || primary.includes('not for inhalation') || primary.includes('pharmacy')) return '#4ade80'
  if (primary.includes('prescription')) return '#fbbf24'
  return '#a78bfa'
}

function ScheduleBadge({ tier, color, system }: { tier: string; color: string; system?: string }) {
  return (
    <div className="law-schedule-badge" style={{ '--badge-c': color } as React.CSSProperties}>
      <div className="law-schedule-glow" />
      <div className="law-schedule-label">SCHEDULE</div>
      <div className="law-schedule-tier">{tier}</div>
      {system && <div className="law-schedule-system">{system}</div>}
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
  const [step, setStep] = useState<Step>('country')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    if (!geo.loading && geo.countryCode && step === 'country') {
    }
  }, [geo.loading, geo.countryCode, step])

  const effectiveCountry = selectedCountry
  const isUS = effectiveCountry === 'US'
  const countryData = useMemo(
    () => legalData.countries.find(c => c.code === effectiveCountry),
    [effectiveCountry]
  )
  const federalStatus = effectiveCountry ? lookupStatus(substance, effectiveCountry) : undefined
  const stateInfo = useMemo(
    () => (legalData as { usStates: { code: string; name: string }[] }).usStates.find(s => s.code === selectedState),
    [selectedState]
  )
  const stateStatus = (isUS && selectedState) ? lookupStateStatus(substance, selectedState) : undefined

  const scheduleMap = (legalData as { schedules: Record<string, { system: string; statute: string; tiers: { tier: string; color: string; description: string }[] }> }).schedules[effectiveCountry]
  const activeTier = findTier(scheduleMap, federalStatus)
  const countryNotes = (legalData as { countryNotes?: Record<string, string> }).countryNotes?.[effectiveCountry]

  function pickCountry(code: string) {
    setSelectedCountry(code)
    setSelectedState('')
    if (code === 'US') {
      setStep('state')
    } else {
      setStep('result')
    }
    setAnimationKey(k => k + 1)
  }

  function pickState(code: string) {
    setSelectedState(code)
    setStep('result')
    setAnimationKey(k => k + 1)
  }

  function useMyLocation() {
    if (!geo.countryCode) return
    pickCountry(geo.countryCode)
  }

  function reset() {
    setStep('country')
    setSelectedCountry('')
    setSelectedState('')
    setAnimationKey(k => k + 1)
  }

  return (
    <div className="legal-wizard" key={animationKey}>
      {step === 'country' && (
        <div className="law-step law-step-enter" key="step-country">
          <div className="law-step-header">
            <div className="law-step-indicator">
              <span className="law-step-dot active" />
              <span className="law-step-line" />
              <span className="law-step-dot" />
              <span className="law-step-line" />
              <span className="law-step-dot" />
            </div>
            <div className="law-step-label">Step 1 of 3 · Select your country</div>
          </div>

          {geo.countryCode && !geo.loading && (
            <button
              onClick={useMyLocation}
              className="law-detect-btn"
              type="button"
            >
              <span className="law-detect-icon"><CountryFlagSvg code={geo.countryCode} /></span>
              Use my location ({geo.countryCode})
            </button>
          )}

          <div className="law-flag-grid law-flag-grid-enter">
            {legalData.countries.map((c, i) => (
              <button
                key={c.code}
                onClick={() => pickCountry(c.code)}
                className="law-flag-pill"
                style={{ '--enter-delay': `${i * 25}ms` } as React.CSSProperties}
                type="button"
              >
                <span className="law-country-flag"><CountryFlagSvg code={c.code} /></span>
                <span className="law-flag-name">{c.name}</span>
                <span className="law-flag-code">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'state' && (
        <div className="law-step law-step-enter" key="step-state">
          <div className="law-step-header">
            <div className="law-step-indicator">
              <span className="law-step-dot done" />
              <span className="law-step-line done" />
              <span className="law-step-dot active" />
              <span className="law-step-line" />
              <span className="law-step-dot" />
            </div>
            <div className="law-step-label">Step 2 of 3 · Select your state</div>
          </div>

          <div className="law-context">
            <span className="law-context-flag"><CountryFlagSvg code="US" /></span>
            <span className="law-context-name">United States</span>
            <button onClick={reset} className="law-context-change" type="button">change</button>
          </div>

          <div className="law-flag-grid law-flag-grid-enter">
            {(legalData as { usStates: { code: string; name: string }[] }).usStates.map((s, i) => (
              <button
                key={s.code}
                onClick={() => pickState(s.code)}
                className="law-flag-pill law-state-pill"
                style={{ '--enter-delay': `${i * 12}ms` } as React.CSSProperties}
                type="button"
              >
                <span className="law-state-flag">
                  <StateFlagSvg code={s.code} />
                </span>
                <span className="law-flag-name">{s.name}</span>
                <span className="law-flag-code">{s.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'result' && countryData && (
        <div className="law-step law-step-enter" key="step-result">
          <div className="law-step-header">
            <div className="law-step-indicator">
              <span className="law-step-dot done" />
              <span className="law-step-line done" />
              <span className="law-step-dot done" />
              <span className="law-step-line done" />
              <span className="law-step-dot active" />
            </div>
            <div className="law-step-label">Step 3 of 3 · Legal Status</div>
          </div>

          <div className="law-context">
            <span className="law-context-flag"><CountryFlagSvg code={countryData.code} /></span>
            <span className="law-context-name">{countryData.name}</span>
            {isUS && stateInfo && (
              <>
                <span className="law-context-divider">›</span>
                <span className="law-state-flag law-context-state">
                  <StateFlagSvg code={stateInfo.code} />
                </span>
                <span className="law-context-name">{stateInfo.name}</span>
              </>
            )}
            <button
              onClick={isUS ? () => setStep('state') : reset}
              className="law-context-change"
              type="button"
            >
              change
            </button>
          </div>

          <ScheduleBadge
            tier={activeTier?.tier || federalStatus || 'Unknown'}
            color={activeTier?.color || tierColor(scheduleMap, federalStatus)}
            system={scheduleMap?.system}
          />

          {activeTier?.description && (
            <div className="law-tier-description">
              {activeTier.description}
            </div>
          )}

          {scheduleMap?.statute && (
            <div className="law-statute">
              <span className="law-statute-label">Source:</span> {scheduleMap.statute}
            </div>
          )}

          {isUS && selectedState && (
            <div className="law-state-block">
              <div className="law-block-header">
                <span className="law-state-flag law-block-flag">
                  <StateFlagSvg code={selectedState} />
                </span>
                <div>
                  <div className="law-block-label">{stateInfo?.name || selectedState}</div>
                  <div className="law-block-sublabel">State-specific status</div>
                </div>
              </div>
              <div className="law-block-status">
                {stateStatus || (
                  <span className="law-block-default">No additional state controls — follows federal law</span>
                )}
              </div>
            </div>
          )}

          {countryNotes && (
            <div className="law-note">
              <span className="law-note-icon">ℹ</span>
              <span className="law-note-text">{countryNotes}</span>
            </div>
          )}

          <button onClick={reset} className="law-restart" type="button">
            ← Start over
          </button>

          <p className="law-disclaimer">
            ⚖ For educational purposes only. Consult a legal professional for current laws.
          </p>
        </div>
      )}
    </div>
  )
}
