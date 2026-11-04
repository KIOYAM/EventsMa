import { PageHeaderSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, card) => (
            <div key={card} className="rounded-card border border-hairline bg-paper p-5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-3 h-3 w-64" />
              <Skeleton className="mt-3 h-3 w-full" />
            </div>
          ))}
        </div>
        <div className="rounded-card border border-hairline bg-paper p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 5 }, (_, row) => (
              <Skeleton key={row} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
