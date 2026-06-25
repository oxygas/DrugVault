import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Medical Disclaimer — TripGem',
  description: 'Read the medical and legal disclaimer for TripGem. Understand that all information is for educational purposes only.',
  alternates: {
    canonical: '/disclaimer',
  },
}

export default function DisclaimerPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full mx-auto max-w-[1800px]">
      <nav className="nav-bar-desktop sticky top-0 z-50 border-b border-[var(--border)] scrolled bg-black/40 backdrop-blur-md">
        <div className="w-full px-5 sm:px-8 h-16 sm:h-18 flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center group flex-shrink-0" aria-label="Go home">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.svg" alt="Gem" className="w-7 h-7 object-contain" />
            </div>
          </Link>
          <span className="text-sm font-display font-bold text-white">Disclaimer</span>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-8 max-w-4xl mx-auto py-8 sm:py-16 space-y-8 flex-1">
        <header className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-white gradient-text">
            Legal &amp; Medical Disclaimer
          </h1>
          <p className="text-base sm:text-lg text-[var(--text3)] leading-relaxed">
            Please read this disclaimer carefully before using any tools or database information provided on TripGem.
          </p>
        </header>

        <section className="glass-strong rounded-2xl border border-[var(--border2)] p-6 sm:p-10 space-y-6 text-[var(--text3)] leading-relaxed">
          <div className="space-y-4 text-white">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-red-400">NOT MEDICAL ADVICE</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              THE CONTENT PROVIDED ON TRIPGEM IS FOR EDUCATIONAL, HISTORICAL, AND HARM REDUCTION PURPOSES ONLY. IT IS NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL ADVICE, DIAGNOSIS, TREATMENT, OR CLINICAL DECISION-MAKING. 
            </p>
            <p className="text-sm sm:text-base leading-relaxed">
              Never disregard professional medical advice or delay seeking treatment because of something you read on this website. If you are experiencing a medical emergency, call your local emergency services (e.g., 911, 999, or 112) immediately.
            </p>
          </div>

          <div className="h-px bg-[var(--border)]" />

          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Emergency Harm Reduction Resources</h2>
            <p>
              If you or someone you are with is in distress, has taken an unknown substance, or is experiencing a difficult state of mind, confidential support services are available:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass p-4 rounded-xl border border-[var(--border2)]">
                <h3 className="font-bold text-white text-sm">Never Use Alone (USA)</h3>
                <p className="text-xs text-[var(--text4)] mt-1">If you are using alone, call to have someone stay on the line with you. If you stop responding, they will call emergency services for you.</p>
                <a href="tel:8004843731" className="text-xs text-[var(--accent2)] hover:underline mt-2 inline-block font-mono font-bold">1-800-484-3731</a>
              </div>
              <div className="glass p-4 rounded-xl border border-[var(--border2)]">
                <h3 className="font-bold text-white text-sm">Fireside Project (USA)</h3>
                <p className="text-xs text-[var(--text4)] mt-1">Psychedelic peer support line. Talk or text with trained volunteers during or after an experience.</p>
                <a href="tel:6282252724" className="text-xs text-[var(--accent2)] hover:underline mt-2 inline-block font-mono font-bold">1-628-225-2724</a>
              </div>
            </div>
          </div>

          <div className="h-px bg-[var(--border)]" />

          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Assumptions of Risk</h2>
            <p>
              By using TripGem, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li><strong>Purity is unpredictable:</strong> Visual inspection cannot verify chemical composition or check for lethal adulterants (such as fentanyl). Reagent testing kits and professional laboratory testing are the only ways to verify substance composition.</li>
              <li><strong>Individual variance:</strong> Dosage guides are generic approximations. Body weight, enzymatic variance, medication interactions, and pre-existing mental/physical conditions heavily alter subjective and physical effects.</li>
              <li><strong>No warranty:</strong> All data is provided &ldquo;as is&rdquo;. While we strive for extreme scientific rigor, we cannot guarantee the complete accuracy or clinical correctness of any metric. Use at your own risk.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
