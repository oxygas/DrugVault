import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About TripGem — Sourcing & Harm Reduction Methodology',
  description: 'Learn about TripGem\'s sourcing guidelines, editorial policy, and commitment to evidence-based education and harm reduction.',
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full mx-auto max-w-[1800px]">
      <nav className="nav-bar-desktop sticky top-0 z-50 border-b border-[var(--border)] scrolled bg-black/40 backdrop-blur-md">
        <div className="w-full px-5 sm:px-8 h-16 sm:h-18 flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-[var(--pink)]" />
              <div className="absolute inset-[1px] rounded-[5px] sm:rounded-[7px] bg-[var(--bg)] flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold font-display bg-gradient-to-br from-[var(--accent2)] to-[var(--pink)] bg-clip-text text-transparent">T</span>
              </div>
            </div>
            <span className="font-display font-bold text-base sm:text-lg tracking-tight hidden sm:inline">
              <span className="text-[var(--accent2)]">Trip</span><span className="text-white">Gem</span>
            </span>
          </Link>
          <div className="h-5 sm:h-6 w-px bg-[var(--border)] flex-shrink-0" />
          <Link href="/" className="p-1.5 sm:p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text3)] hover:text-white flex-shrink-0" aria-label="Go home">
            <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
          <span className="text-sm font-display font-bold text-white">About Us</span>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-8 max-w-4xl mx-auto py-8 sm:py-16 space-y-8 flex-1">
        <header className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-white gradient-text">
            About TripGem
          </h1>
          <p className="text-base sm:text-lg text-[var(--text3)] leading-relaxed">
            TripGem is an open-source educational database and drug interaction checker designed to minimize substance-related harms through science-based transparency.
          </p>
        </header>

        <section className="glass-strong rounded-2xl border border-[var(--border2)] p-6 sm:p-10 space-y-6 text-[var(--text3)] leading-relaxed">
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Our Mission</h2>
            <p>
              We believe in harm reduction—the pragmatic philosophy that individuals deserve accurate, scientific information to keep themselves safe. Rather than relying on scare tactics or moral judgments, TripGem provides clean, objective access to substance dosage guidelines, active duration timelines, and critical chemical interactions.
            </p>
          </div>

          <div className="h-px bg-[var(--border)]" />

          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Evidence-Based Sourcing</h2>
            <p>
              TripGem consolidates and cross-references data from the world&apos;s leading harm reduction resources, NGO guidelines, and medical literature. Our primary references include:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-mono text-xs sm:text-sm">
              <li><strong className="text-[var(--accent2)]">PsychonautWiki</strong> — Peer-reviewed database for dosage, duration, and effects.</li>
              <li><strong className="text-[var(--accent2)]">TripSit.me</strong> — Substance combination guidelines and safety warnings.</li>
              <li><strong className="text-[var(--accent2)]">Erowid Center</strong> — Over 25 years of experiential and toxicological archives.</li>
              <li><strong className="text-[var(--accent2)]">World Health Organization (WHO)</strong> &amp; <strong className="text-[var(--accent2)]">FDA</strong> — Official pharmacotherapy and critical toxicity thresholds.</li>
              <li><strong className="text-[var(--accent2)]">PubMed / ClinicalTrials.gov</strong> — Direct research papers on drug interactions and pharmacology.</li>
            </ul>
          </div>

          <div className="h-px bg-[var(--border)]" />

          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Legal &amp; Safety Stance</h2>
            <p>
              TripGem does not condone, promote, or encourage the acquisition or ingestion of illegal compounds. Our role is strictly educational. We emphasize that:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>No substance combination is 100% safe.</li>
              <li>Individual biology, purity variations, and underlying health factors introduce unpredictable risks.</li>
              <li>Always seek clinical guidance for prescription drugs and mental health concerns.</li>
            </ul>
          </div>
        </section>

        <footer className="w-full text-center py-6 border-t border-[var(--border)] mt-8">
          <p className="text-[11px] text-[var(--text4)]">
            TripGem is open-source. Help audit or contribute on <a href="https://github.com/oxygas/DrugVault" target="_blank" rel="noopener noreferrer" className="text-[var(--accent2)] hover:underline">GitHub</a>.
          </p>
        </footer>
      </main>
    </div>
  )
}
