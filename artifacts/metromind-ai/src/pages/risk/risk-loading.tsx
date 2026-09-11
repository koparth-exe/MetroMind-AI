import { Skeleton } from '@/components/metro-shell';

export function RiskLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading Risk Workbench">
      {/* Header Skeleton */}
      <div className="rounded-2xl border border-border/70 bg-card/90 p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-28 w-80 rounded-xl" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-6 w-32 rounded-lg" />
        </div>
      </div>

      {/* Hero Status Skeleton */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
        <Skeleton className="h-60 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>

      {/* Scale & Utilization Skeletons */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>

      {/* Matrix Skeleton */}
      <Skeleton className="h-80 rounded-2xl" />

      {/* Distribution Skeleton */}
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
