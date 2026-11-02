import { StatSkeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-8 w-full max-w-md rounded" />
        <div className="skeleton h-3 w-full max-w-lg rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton rows={5} />
    </div>
  )
}
