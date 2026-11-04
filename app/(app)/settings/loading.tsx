import { PageHeaderSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, card) => (
          <div key={card} className="rounded-card border border-hairline bg-paper p-5">
            <Skeleton className="h-4 w-32" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 5 }, (_, row) => (
                <div key={row} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
