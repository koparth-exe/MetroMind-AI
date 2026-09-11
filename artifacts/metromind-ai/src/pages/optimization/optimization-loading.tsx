import { Skeleton } from '@/components/metro-shell';

export function OptimizationLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading Optimization Workbench">
      {/* Header Skeleton */}
      <div className="rounded-2xl border border-border/70 bg-card/90 p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>
      </div>

      {/* Context Hero Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>

      {/* Constraint Workbench Skeleton */}
      <Skeleton className="h-64 rounded-2xl" />

      {/* Matrix and Visualizer Skeleton */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>

      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
