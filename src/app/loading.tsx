export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[var(--bg)]"
      style={{ minHeight: '100dvh' }}
    >
      <div className="flex flex-col items-center gap-6 sm:gap-8">
        <img
          src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXFkdHQzaHphODF6Y3Rlb2JnMTYybzlsaHVibG8zZXNpYjAybWc4NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wt0zLr2PkDbDkfQOSo/giphy.gif"
          alt="TripGem"
          className="tripgem-logo w-16 h-16 sm:w-24 sm:h-24"
        />

        <span className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight">
          <span className="tripgem-text-trip">Trip</span>
          <span className="tripgem-text-gem">Gem</span>
        </span>

        <div className="w-48 sm:w-56 h-1 rounded-full bg-[var(--border2)] overflow-hidden">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--pink)] loading-bar-fill" />
        </div>

        <p className="text-xs sm:text-sm text-[var(--text3)] tracking-widest uppercase mt-2">
          not working on overdoing
        </p>
      </div>
    </div>
  )
}
