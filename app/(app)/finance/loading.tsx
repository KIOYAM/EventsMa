import { PageHeaderSkeleton, StatSkeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <TableSkeleton rows={5} />
        <div className="rounded-card border border-hairline bg-paper p-5">
          <div className="h-10 w-full rounded bg-canvas" />
        </div>
      </div>
    </div>
  )
}
