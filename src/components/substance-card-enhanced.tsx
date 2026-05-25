'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { BookmarkButton } from './bookmark-button'
import { cn } from '@/lib/utils'
import { AlertTriangle, Shield, Clock, Syringe } from 'lucide-react'

interface EnhancedCardProps {
  name: string
  slug: string
  category: string
  harmScore: number
  addictionScore: number
  onset?: string
  duration?: string
  roas?: string[]
  onClick: () => void
  index?: number
}

const CATEGORY_COLORS: Record<string, string> = {
  Psychedelic: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
  Stimulant: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
  Depressant: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
  Opioid: 'from-red-500/20 to-orange-500/10 border-red-500/30',
  Dissociative: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/30',
  Cannabinoid: 'from-green-500/20 to-emerald-500/10 border-green-500/30',
  Empathogen: 'from-pink-500/20 to-rose-500/10 border-pink-500/30',
  Nootropic: 'from-teal-500/20 to-cyan-500/10 border-teal-500/30',
}

function harmColor(score: number): string {
  if (score >= 70) return 'text-red-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-green-400'
}

function harmBar(score: number): string {
  if (score >= 70) return 'bg-red-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-green-500'
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function SubstanceCardEnhanced({
  name,
  category,
  harmScore,
  addictionScore,
  onset,
  duration,
  roas,
  onClick,
  index = 0,
}: EnhancedCardProps) {
  const borderColors = CATEGORY_COLORS[category] ?? 'from-zinc-500/20 to-zinc-500/10 border-zinc-500/30'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <Card
        className={cn(
          'group relative overflow-hidden border bg-gradient-to-br p-4 cursor-pointer',
          'transition-shadow duration-200',
          'hover:shadow-lg hover:shadow-zinc-900/40',
          borderColors
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
              {name}
            </h3>
            <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0 h-4 font-normal opacity-70">
              {category}
            </Badge>
          </div>
          <BookmarkButton slug={slugify(name)} size="icon" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Shield className={cn('h-3 w-3', harmColor(harmScore))} />
            <span>Harm</span>
            <span className={cn('ml-auto font-medium', harmColor(harmScore))}>{harmScore}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <AlertTriangle className={cn('h-3 w-3', addictionScore > 50 ? 'text-amber-400' : 'text-zinc-500')} />
            <span>Addiction</span>
            <span className="ml-auto font-medium text-zinc-300">{addictionScore}</span>
          </div>
        </div>

        <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', harmBar(harmScore))}
            initial={{ width: 0 }}
            animate={{ width: `${harmScore}%` }}
            transition={{ delay: 0.2 + index * 0.03, duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {(onset || duration) && (
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-zinc-500">
            {onset && (
              <span className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                Onset: {onset}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                Duration: {duration}
              </span>
            )}
          </div>
        )}

        {roas && roas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {roas.slice(0, 3).map((roa) => (
              <span
                key={roa}
                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/50 text-zinc-400"
              >
                <Syringe className="h-2 w-2" />
                {roa}
              </span>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
