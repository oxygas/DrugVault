'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center px-5">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[rgba(239,68,68,0.08)] flex items-center justify-center border border-[rgba(239,68,68,0.15)]">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-[var(--text3)] leading-relaxed">
            An unexpected error occurred. Our team has been notified.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="cta-btn"
            style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
          >
            Try Again
          </button>
          <a
            href="/"
            className="cta-btn"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}
          >
            Go Home
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left text-xs text-[var(--text4)] font-mono bg-[rgba(255,255,255,0.02)] p-4 rounded-lg overflow-auto max-h-48">
            <summary className="cursor-pointer text-[var(--text3)]">Error details (dev only)</summary>
            <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
            <pre className="mt-2 whitespace-pre-wrap opacity-60">{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  )
}
