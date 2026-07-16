import dynamic from 'next/dynamic'
import { createElement } from 'react'

export interface FeatureConfig {
  key: string
  label: string
  icon: string
  order: number
  component: React.ComponentType<any>
}

/**
 * Wraps a dynamic import with retry logic — retries up to `maxRetries` times
 * with exponential backoff before giving up.  Handles the common case where a
 * chunk fails to load due to a network glitch, stale SW cache, or a Vercel
 * deployment swapping assets out from under a long-lived tab.
 */
function retryDynamicImport<T>(
  importFn: () => Promise<T>,
  maxRetries = 3,
): () => Promise<T> {
  return async () => {
    let lastError: unknown
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await importFn()
      } catch (err) {
        lastError = err
        if (i < maxRetries) {
          // Exponential backoff: 500ms, 1s, 2s
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)))
        }
      }
    }
    throw lastError
  }
}

/** Lightweight skeleton shown while a section chunk loads. */
function SectionSkeleton() {
  return createElement('div', {
    className: 'w-full space-y-4 animate-pulse py-8',
    'aria-label': 'Loading section…',
  },
    createElement('div', { className: 'h-10 rounded-xl skeleton-shimmer max-w-lg mx-auto' }),
    createElement('div', { className: 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4' },
      Array.from({ length: 8 }, (_, i) =>
        createElement('div', {
          key: i,
          className: 'rounded-xl skeleton-shimmer p-4 space-y-3',
          style: { animationDelay: `${i * 60}ms` },
        },
          createElement('div', { className: 'h-4 w-3/4 rounded bg-[rgba(var(--accent-rgb),0.1)]' }),
          createElement('div', { className: 'h-3 w-full rounded bg-[rgba(var(--accent2-rgb),0.08)]' }),
          createElement('div', { className: 'h-3 w-1/2 rounded bg-[rgba(var(--accent-rgb),0.06)]' }),
        )
      )
    )
  )
}

// Section components now use retry-capable imports and skeleton loading UI.
const SubstancesSection = dynamic(
  retryDynamicImport(() => import('@/features/substances/components/SubstancesSection')),
  { loading: SectionSkeleton }
)

const MatrixSection = dynamic(
  retryDynamicImport(() => import('@/features/matrix/components/MatrixSection')),
  { loading: SectionSkeleton }
)

const ToolsSection = dynamic(
  retryDynamicImport(() => import('@/features/tools/components/ToolsSection')),
  { loading: SectionSkeleton }
)

export const FEATURES: FeatureConfig[] = [
  {
    key: 'substances',
    label: 'Substances',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h3.75m-3.75 0H5.625m7.5 0H15m-1.5 0v3.375M12 14.25v3.375m0-3.375H9.75m2.25 0h2.25',
    order: 1,
    component: SubstancesSection,
  },
  {
    key: 'matrix',
    label: 'Matrix',
    icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
    order: 2,
    component: MatrixSection,
  },
  {
    key: 'tools',
    label: 'Tools',
    icon: 'M11.42 15.17l-5.384-3.108A2.25 2.25 0 014.5 10.004V7.5a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25v2.504c0 .576-.22 1.11-.58 1.516l.25.15M11.42 15.17l5.384 3.108a2.25 2.25 0 002.42 0l5.384-3.108M11.42 15.17l.25-.15M20.25 7.5a2.25 2.25 0 00-2.25-2.25h-2.25A2.25 2.25 0 0013.5 7.5v2.504c0 .576.22 1.11.58 1.516l-.25.15m0 0l-5.384 3.108M20.25 7.5v2.504c0 .576-.22 1.11-.58 1.516l.25.15m-5.65 3.262l5.384-3.108',
    order: 3,
    component: ToolsSection,
  },
]

export function getFeature(key: string): FeatureConfig | undefined {
  return FEATURES.find(f => f.key === key)
}

export function getSortedFeatures(): FeatureConfig[] {
  return [...FEATURES].sort((a, b) => a.order - b.order)
}

export function registerFeature(feature: FeatureConfig): void {
  const existing = FEATURES.findIndex(f => f.key === feature.key)
  if (existing >= 0) FEATURES[existing] = feature
  else FEATURES.push(feature)
}

export function unregisterFeature(key: string): void {
  const idx = FEATURES.findIndex(f => f.key === key)
  if (idx >= 0) FEATURES.splice(idx, 1)
}
