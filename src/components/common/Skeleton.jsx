/** Pulse placeholder used while async sections load. */
export default function Skeleton({ className = 'h-4 w-full', rounded = 'rounded-md' }) {
  return <div className={`animate-pulse bg-slate-200/80 dark:bg-ink/60 ${rounded} ${className}`} aria-hidden />;
}

/** A few stacked skeleton rows. */
export function SkeletonRows({ rows = 4, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0" rounded="rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
