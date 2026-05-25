'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { SafetyOverlay } from '@/components/safety-overlay'
import { ComboChecker } from '@/components/combo-checker'
import { DosageCalculator } from '@/components/dosage-calculator'
import { EffectTimeline } from '@/components/effect-timeline'
import { TripJournal } from '@/components/trip-journal'
import { SubstanceCardEnhanced } from '@/components/substance-card-enhanced'
import { MOCK_SUBSTANCES } from '@/data/mock-substances'
import { useBookmarkStore } from '@/stores/bookmarks'
import {
  FlaskConical, Syringe, Clock, BookOpen, Grid3X3, Sparkles,
  AlertTriangle, ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Grid3X3 },
  { id: 'combo', label: 'Combo Checker', icon: AlertTriangle },
  { id: 'dosage', label: 'Dosage', icon: Syringe },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'journal', label: 'Trip Journal', icon: BookOpen },
]

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function LabClient() {
  const [tab, setTab] = useState('overview')
  const [selectedSubstance, setSelectedSubstance] = useState<string | null>(null)
  const bookmarks = useBookmarkStore((s) => s.bookmarks)

  const substance = selectedSubstance
    ? MOCK_SUBSTANCES.find((s) => s.id === selectedSubstance)
    : null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            TripGem
          </Link>
          <span className="text-zinc-700 text-xs">/</span>
          <span className="text-xs font-medium text-zinc-300">Lab</span>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-purple-400 bg-purple-950/30 border border-purple-500/20 rounded-full px-2.5 py-0.5">
            <Sparkles className="h-3 w-3" />
            Next-Gen Preview
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SafetyOverlay id="lab" />
        </motion.div>

        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelectedSubstance(null) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all',
                tab === t.id
                  ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              )}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Substances" value={MOCK_SUBSTANCES.length} icon={FlaskConical} />
                  <StatCard label="Categories" value={new Set(MOCK_SUBSTANCES.map(s => s.category)).size} icon={Grid3X3} />
                  <StatCard label="Combinations" value="96" icon={AlertTriangle} />
                  <StatCard label="Bookmarked" value={bookmarks.length} icon={BookOpen} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                    Enhanced Substance Cards <span className="text-xs text-zinc-500 font-normal">(with Framer Motion + bookmarking)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {MOCK_SUBSTANCES.map((s, i) => (
                      <SubstanceCardEnhanced
                        key={s.id}
                        name={s.name}
                        slug={s.id}
                        category={s.category}
                        harmScore={s.harmScore}
                        addictionScore={s.addictionPotential}
                        onset={s.onset}
                        duration={s.duration}
                        roas={s.roas.map((r) => r.name)}
                        onClick={() => setSelectedSubstance(s.id)}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'combo' && (
              <div className="space-y-4">
                <SafetyOverlay id="combos" />
                <div className="mb-1">
                  <h2 className="text-base font-semibold text-zinc-200">Combination Checker</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Color-coded risk matrix with detailed explanations and safer alternatives.
                  </p>
                </div>
                <ComboChecker />
              </div>
            )}

            {tab === 'dosage' && (
              <div className="space-y-4">
                <SafetyOverlay id="dosage" />
                <div className="mb-1">
                  <h2 className="text-base font-semibold text-zinc-200">Dosage Calculator</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    ROA-specific sliders, tolerance estimator, and red-flag warnings.
                  </p>
                </div>
                <DosageCalculator />
              </div>
            )}

            {tab === 'timeline' && (
              <div className="space-y-4">
                <div className="mb-1">
                  <h2 className="text-base font-semibold text-zinc-200">Effect Timeline</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Visual timeline of substance effects by phase.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {MOCK_SUBSTANCES.filter(s => ['MDMA', 'LSD', 'Ketamine'].includes(s.name)).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSubstance(s.id === selectedSubstance ? null : s.id)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors',
                        selectedSubstance === s.id
                          ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                {selectedSubstance && substance ? (
                  <EffectTimeline
                    substance={substance.name}
                    onset={substance.onset ?? ''}
                    duration={substance.duration ?? ''}
                    afterEffects={substance.offset}
                  />
                ) : (
                  <div className="text-center py-8 text-xs text-zinc-600">
                    Select a substance above to see its effect timeline
                  </div>
                )}
              </div>
            )}

            {tab === 'journal' && (
              <div className="space-y-4">
                <div className="mb-1">
                  <h2 className="text-base font-semibold text-zinc-200">Private Trip Journal</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    All data stored locally. Export/import anytime.
                  </p>
                </div>
                <TripJournal />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center"
    >
      <Icon className="h-4 w-4 text-purple-400 mx-auto mb-1" />
      <div className="text-lg font-bold text-zinc-100 tabular-nums">{value}</div>
      <div className="text-[10px] text-zinc-500">{label}</div>
    </motion.div>
  )
}
