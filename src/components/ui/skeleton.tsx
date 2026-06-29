/** Shimmer placeholder used while data loads */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className ?? ''}`} />
  )
}

/** Full-page loading skeleton for list-style pages */
export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="px-4 pt-4 space-y-3">
      {/* Header area */}
      <Skeleton className="h-8 w-40 mb-4" />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>

      {/* Row items */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
          <Skeleton className="w-10 h-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-20 shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** Compact skeleton for a single card */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-3 ${className ?? ''}`}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}
