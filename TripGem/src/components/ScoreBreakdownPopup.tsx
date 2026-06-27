'use client'

import { useEffect, useRef } from 'react'
import { useUIStore, type ScoreKey } from '@/stores/ui'
import { useScrollLock } from '@/lib/use-scroll-lock'
import type { Substance } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'
import { playClose } from '@/lib/ui-sounds'

interface ScoreBreakdownPopupProps {
  substances: Substance[]
}

const SCORE_LABELS: Record<ScoreKey, string> = {
  harmScore: 'Harm Score',
  addictionScore: 'Addiction Score',
  odRisk: 'Overdose Risk',
  withdrawalSeverity: 'Withdrawal Severity',
  interactionDanger: 'Interaction Danger',
  dependenceLiability: 'Dependence Liability'
}

const SCORE_DESCRIPTIONS: Record<ScoreKey, string> = {
  harmScore: 'Measures physical, acute, and chronic damage to organs and overall health.',
  addictionScore: 'Measures psychological reinforcement, cravings, and compulsive redosing.',
  odRisk: 'Measures the danger of life-threatening toxicity or overdose from high doses.',
  withdrawalSeverity: 'Measures the severity and physical danger of discontinuation symptoms.',
  interactionDanger: 'Measures the risk of dangerous synergistic reactions when combined with other categories.',
  dependenceLiability: 'Measures how quickly the body develops tolerance and physical dependence.'
}

function getSeverityColor(score: number): string {
  if (score <= 30) return 'var(--green)'
  if (score <= 60) return 'var(--yellow)'
  return 'var(--red)'
}

export default function ScoreBreakdownPopup({ substances }: ScoreBreakdownPopupProps) {
  const scoreBreakdown = useUIStore(s => s.scoreBreakdown)
  const closeScoreBreakdown = useUIStore(s => s.closeScoreBreakdown)
  const { isOpen, substanceName, scoreKey } = scoreBreakdown
  const overlayRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playClose()
        closeScoreBreakdown()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, closeScoreBreakdown])

  useEffect(() => {
    if (!isOpen) return
    const popup = popupRef.current
    if (popup) {
      const first = popup.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      first?.focus()
    }
  }, [isOpen])

  useScrollLock(isOpen)

  if (!isOpen || !substanceName || !scoreKey) return null

  const substance = substances.find(s => s.name === substanceName)
  if (!substance) return null

  const breakdown = substance.scoreBreakdowns?.[scoreKey]
  const scoreValue = substance[scoreKey] as number
  const catColor = CATEGORY_COLORS[substance.category] || 'var(--accent)'
  const severityColor = getSeverityColor(scoreValue)

  const handleClose = () => {
    playClose()
    closeScoreBreakdown()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === overlayRef.current) handleClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`${SCORE_LABELS[scoreKey]} Breakdown`}
    >
      <div
        ref={popupRef}
        className="glass-strong neon-popup-glow w-full sm:max-w-xl max-h-[85vh] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)', overscrollBehavior: 'contain' }}
      >
        <div className="popup-header sticky top-0 z-10 p-4 sm:p-5 border-b border-[var(--border)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs lg:text-sm text-[var(--text3)] font-display">{substance.name}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white truncate flex items-center gap-2">
                {SCORE_LABELS[scoreKey]}
                <span
                  className="px-2.5 py-0.5 rounded-full text-sm font-mono"
                  style={{ background: `${severityColor}20`, color: severityColor, border: `1px solid ${severityColor}40` }}
                >
                  {scoreValue}/100
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text3)] mt-2 leading-relaxed max-w-lg font-sans">
                {SCORE_DESCRIPTIONS[scoreKey]}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text4)] hover:text-white flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 substance-popup-scroll" style={{ overscrollBehavior: 'contain' }}>
          {(() => {
            const hasFactors = breakdown && breakdown.factors.length > 0;
            if (hasFactors) {
              return (
                <div className="space-y-4">
                  {breakdown.factors.map((factor, i) => (
                    <div 
                      key={i} 
                      className="info-card group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-transparent hover:border-[var(--info-c)]/20" 
                      style={{ '--info-c': catColor } as React.CSSProperties}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--info-c)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <h4 className="text-sm font-semibold mb-2 text-[var(--text2)] font-display flex items-center gap-2 relative z-10">
                        <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_var(--info-c)] group-hover:animate-pulse" style={{ background: catColor }} />
                        <span className="bg-gradient-to-r from-white to-[var(--text2)] bg-clip-text group-hover:text-transparent transition-all duration-300">{factor.label}</span>
                      </h4>
                      <p className="text-[13px] sm:text-[14px] text-[var(--text3)] leading-relaxed mb-3 relative z-10 group-hover:text-[var(--text2)] transition-colors duration-300">
                        {factor.explanation}
                      </p>
                      {factor.sourceUrl && (
                        <a
                          href={factor.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] sm:text-xs text-[var(--accent2)] hover:text-white hover:underline inline-flex items-center gap-1.5 relative z-10 transition-colors bg-[var(--accent2)]/10 px-2 py-1 rounded-md"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Read Study
                        </a>
                      )}
                    </div>
                  ))}
                  
                  {breakdown.sourceUrl && (
                    <div className="pt-2 text-right">
                      <a
                        href={breakdown.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--text4)] hover:text-[var(--text2)] transition-colors inline-flex items-center gap-1"
                      >
                        Score overall source
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              );
            }

            // Fallback dynamically generated explanation (at most 1 sentence)
            const isLow = scoreValue <= 30;
            const isMod = scoreValue <= 60;
            let label = "";
            let explanation = "";

            switch (scoreKey) {
              case 'harmScore':
                label = 'Physical Harm Assessment';
                explanation = isLow
                  ? `${substance.name} has a low physical harm rating (${scoreValue}/100), indicating minimal risk of organ damage or toxicity under normal use.`
                  : isMod
                  ? `${substance.name} carries a moderate physical harm rating (${scoreValue}/100), suggesting potential for moderate physiological damage if misused.`
                  : `${substance.name} has a high physical harm rating (${scoreValue}/100), representing substantial risk of severe toxicity or organ damage.`;
                break;
              case 'addictionScore':
                label = 'Addiction & Reinforcement';
                explanation = isLow
                  ? `${substance.name} has a low addiction rating (${scoreValue}/100), indicating minimal psychological reinforcement or compulsive redosing potential.`
                  : isMod
                  ? `${substance.name} has a moderate addiction rating (${scoreValue}/100), suggesting a moderate potential for habit formation and psychological craving.`
                  : `${substance.name} carries a high addiction rating (${scoreValue}/100), indicating strong psychological reinforcement and a high risk of compulsive use.`;
                break;
              case 'dependenceLiability':
                label = 'Tolerance & Physical Dependence';
                explanation = isLow
                  ? `${substance.name} has a low dependence rating (${scoreValue}/100), meaning the body does not rapidly build physical tolerance or dependence.`
                  : isMod
                  ? `${substance.name} has a moderate dependence rating (${scoreValue}/100), meaning moderate tolerance and physical dependence can develop over time.`
                  : `${substance.name} carries a high dependence rating (${scoreValue}/100), indicating rapid development of physical tolerance and significant dependence.`;
                break;
              case 'odRisk':
                label = 'Acute Overdose Risk';
                explanation = isLow
                  ? `${substance.name} has a low overdose risk (${scoreValue}/100), indicating a wide safety margin before reaching toxic or dangerous doses.`
                  : isMod
                  ? `${substance.name} has a moderate overdose risk (${scoreValue}/100), meaning severe toxicity is possible when exceeding standard dosages.`
                  : `${substance.name} carries a high overdose risk (${scoreValue}/100), indicating a narrow safety margin and high danger of life-threatening toxicity.`;
                break;
              case 'withdrawalSeverity':
                label = 'Withdrawal & Cessation';
                explanation = isLow
                  ? `${substance.name} has a low withdrawal rating (${scoreValue}/100), meaning cessation typically causes minimal to no physical discomfort.`
                  : isMod
                  ? `${substance.name} has a moderate withdrawal rating (${scoreValue}/100), meaning cessation can result in uncomfortable but manageable symptoms.`
                  : `${substance.name} carries a high withdrawal rating (${scoreValue}/100), indicating that cessation can trigger severe and potentially dangerous withdrawal.`;
                break;
              case 'interactionDanger':
                label = 'Synergistic Interaction Risk';
                explanation = isLow
                  ? `${substance.name} has a low interaction danger (${scoreValue}/100), meaning it has relatively few severe interactions with other drug classes.`
                  : isMod
                  ? `${substance.name} has a moderate interaction danger (${scoreValue}/100), indicating a moderate number of dangerous synergistic interactions.`
                  : `${substance.name} carries a high interaction danger (${scoreValue}/100), indicating extreme risk of dangerous or fatal reactions when mixed.`;
                break;
              default:
                return <p className="text-[var(--text4)] text-sm italic">No specific factors available for this score.</p>;
            }

            return (
              <div 
                className="info-card group relative overflow-hidden transition-all duration-300 border border-transparent hover:border-[var(--info-c)]/20" 
                style={{ '--info-c': catColor } as React.CSSProperties}
              >
                <h4 className="text-sm font-semibold mb-2 text-[var(--text2)] font-display flex items-center gap-2 relative z-10">
                  <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_var(--info-c)]" style={{ background: catColor }} />
                  <span>{label}</span>
                </h4>
                <p className="text-[13px] sm:text-[14px] text-[var(--text3)] leading-relaxed relative z-10">
                  {explanation}
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  )
}
