export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-10 w-20 rounded-lg skeleton-shimmer ml-auto" />
        </div>
        <div className="h-12 rounded-xl skeleton-shimmer" />
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full skeleton-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl skeleton-shimmer p-4 space-y-3" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-full rounded bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
