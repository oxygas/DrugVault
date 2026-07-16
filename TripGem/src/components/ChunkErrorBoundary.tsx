'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional label shown in the error UI (e.g. "Substances") */
  section?: string
}

interface State {
  hasError: boolean
  retryCount: number
}

/**
 * Catches chunk-load / dynamic-import failures and gives the user a
 * one-click retry without a full page reload.  After 3 retries it
 * falls back to a hard reload.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  private handleRetry = () => {
    const next = this.state.retryCount + 1
    if (next > 3) {
      // After 3 soft retries just do a hard reload to clear stale SW cache
      window.location.reload()
      return
    }
    this.setState({ hasError: false, retryCount: next })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(239,68,68,0.08)] flex items-center justify-center border border-[rgba(239,68,68,0.15)]">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text2)]">
              {this.props.section
                ? `Failed to load ${this.props.section}`
                : 'Something failed to load'}
            </p>
            <p className="text-xs text-[var(--text4)] mt-1">
              This usually means a network hiccup or stale cache.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="cta-btn px-5 py-2.5 text-sm"
            style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
          >
            {this.state.retryCount >= 3 ? 'Reload Page' : 'Retry'}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
