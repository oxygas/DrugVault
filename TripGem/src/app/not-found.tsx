import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center px-5">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[rgba(168,85,247,0.08)] flex items-center justify-center border border-[rgba(168,85,247,0.15)]">
          <span className="text-4xl font-display font-bold text-[var(--accent2)]">404</span>
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Page Not Found</h2>
          <p className="text-sm text-[var(--text3)] leading-relaxed">
            The substance or page you&apos;re looking for doesn&apos;t exist in our database.
          </p>
        </div>
        <Link
          href="/"
          className="cta-btn inline-block"
          style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
        >
          Browse Substances
        </Link>
      </div>
    </div>
  )
}
