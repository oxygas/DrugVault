'use client'

import { useState, useEffect } from 'react'

const TIMEOUT_MS = 12_000

export default function Loading() {
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setStuck(true), TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="font-display font-extrabold text-4xl tracking-tight">
            <span className="tripgem-text-trip">Trip</span>
            <span className="tripgem-text-gem">Gem</span>
          </div>
        </div>

        {stuck ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm text-[var(--text3)]">
              Taking longer than expected…
            </p>
            <button
              onClick={() => window.location.reload()}
              className="cta-btn px-6 py-2.5 text-sm"
              style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
            >
              Reload Page
            </button>
          </div>
        ) : (
          <>
            <div className="h-12 rounded-xl skeleton-shimmer" />
            <div className="flex gap-2 flex-wrap">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-full skeleton-shimmer" />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl skeleton-shimmer p-4 space-y-3" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="h-4 w-3/4 rounded bg-[rgba(var(--accent-rgb),0.1)]" />
                  <div className="h-3 w-full rounded bg-[rgba(var(--accent2-rgb),0.08)]" />
                  <div className="h-3 w-1/2 rounded bg-[rgba(var(--accent-rgb),0.06)]" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
