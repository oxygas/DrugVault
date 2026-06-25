import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — TripGem',
  description: 'Your privacy is paramount. Learn how TripGem uses local browser processing to ensure zero logging of your substance searches.',
  alternates: {
    canonical: '/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full mx-auto max-w-[1800px]">
      <nav className="nav-bar-desktop sticky top-0 z-50 border-b border-[var(--border)] scrolled bg-black/40 backdrop-blur-md">
        <div className="w-full px-5 sm:px-8 h-16 sm:h-18 flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center group flex-shrink-0" aria-label="Go home">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.svg" alt="Gem" className="w-7 h-7 object-contain" />
            </div>
          </Link>
          <span className="text-sm font-display font-bold text-white">Privacy Policy</span>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-8 max-w-4xl mx-auto py-8 sm:py-16 space-y-8 flex-1">
        <header className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-white gradient-text">
            Privacy Policy
          </h1>
          <p className="text-base sm:text-lg text-[var(--text3)] leading-relaxed">
            Because TripGem provides harm reduction tools for sensitive scenarios, your privacy and anonymity are integrated into the core design of our software.
          </p>
        </header>

        <section className="glass-strong rounded-2xl border border-[var(--border2)] p-6 sm:p-10 space-y-6 text-[var(--text3)] leading-relaxed">
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">1. Zero Server-Side Logging</h2>
            <p>
              When you search for a substance or test a drug combination, all calculation and filtering occurs <strong className="text-[var(--accent2)]">locally inside your browser</strong>. 
            </p>
            <p>
              We do not transmit your searches, weight entries, or substance selections to our servers. We maintain zero databases of user activity, search logs, or IP-to-query mappings.
            </p>
          </div>

          <div className="h-px bg-[var(--border)]" />

          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">2. Local Storage</h2>
            <p>
              Your settings (such as your weight, units, user profile type, theme choice, and audio volume toggle) are stored in your device&apos;s local storage (`localStorage`). This data never leaves your browser and can be wiped at any time by clearing your browser data or clicking &ldquo;Clear Searches&rdquo; in the Settings menu.
            </p>
          </div>

          <div className="h-px bg-[var(--border)]" />

          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">3. Third-Party Analytics</h2>
            <p>
              We use highly-restrictive, privacy-friendly analytics configuration. No cookies are set, no personal identifiers are collected, and IP addresses are completely anonymized immediately at the edge. We monitor traffic volume solely to keep the hosting servers running efficiently.
            </p>
          </div>

          <div className="h-px bg-[var(--border)]" />

          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">4. GDPR &amp; CCPA Compliance</h2>
            <p>
              Since we collect zero personal data, there is no personal data to delete, inspect, or transfer. You are entirely anonymous when using TripGem.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
