import { Skeleton, StatSkeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-3 w-20" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-2/3 max-w-lg" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-card border border-hairline bg-paper p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }, (_, row) => (
              <Skeleton key={row} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-card border border-hairline bg-paper p-5">
          <Skeleton className="h-4 w-24" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }, (_, row) => (
              <Skeleton key={row} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
