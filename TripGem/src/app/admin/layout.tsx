'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { redirect } from 'next/navigation'
import { clearCookie } from '@/lib/admin-auth'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/admin/login') {
      // Cookie validation happens server-side via middleware
    }
  }, [pathname])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {pathname !== '/admin/login' && (
        <nav className="sticky top-0 z-50 border-b border-[var(--border)] glass" style={{ backdropFilter: 'blur(16px) saturate(1.4)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <Link href="/admin" className="font-display font-bold text-xl text-[var(--accent2)] tracking-tight">
                  TripGem Admin
                </Link>
                <div className="hidden md:flex items-center gap-1 border border-[var(--border)] rounded-lg p-1 bg-[var(--surface)]">
                  <Link href="/admin" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pathname === '/admin' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
                    Dashboard
                  </Link>
                  <Link href="/admin/analytics" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pathname === '/admin/analytics' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
                    Analytics
                  </Link>
                  <Link href="/admin/substances" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pathname === '/admin/substances' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
                    Substances
                  </Link>
                  <Link href="/admin/combos" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pathname === '/admin/combos' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
                    Combos
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text4)] hover:text-[var(--accent2)] transition-colors">
                  View Site
                </Link>
                <button
                  onClick={clearCookie}
                  className="px-4 py-2 text-sm font-medium text-[var(--text3)] hover:text-[var(--red)] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
