import { Skeleton } from '@/components/metro-shell';
import { LoaderCircle, Sparkles } from 'lucide-react';

export function PredictionLoading() {
  return (
    <div
      aria-label="Loading Prediction Workspace"
      aria-busy="true"
      className="space-y-6"
    >
      {/* Header Skeleton */}
      <div className="rounded-2xl border border-border/80 bg-card/95 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <LoaderCircle size={15} className="animate-spin text-primary" />
            <span className="font-mono-ui text-xs font-semibold text-primary">
              Running forecast...
            </span>
          </div>
        </div>
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Main Grid: Controls + Dominant Hero */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Controls Skeleton (Left 5 Cols) */}
        <div className="xl:col-span-5 rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs space-y-4">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Hero Skeleton (Right 7 Cols) */}
        <div className="xl:col-span-7 rounded-3xl border border-primary/20 bg-card/95 p-7 shadow-xs space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-16 w-56 rounded-xl" />
            <Skeleton className="h-6 w-44 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Uncertainty Band Skeleton */}
      <div className="rounded-2xl border border-border/80 bg-card/95 p-6 shadow-xs space-y-4">
        <Skeleton className="h-6 w-56 rounded-md" />
        <Skeleton className="h-6 w-full rounded-full" />
        <div className="grid grid-cols-4 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>

      {/* Multi-corridor Breakdown Skeleton */}
      <div className="rounded-2xl border border-border/80 bg-card/95 p-6 shadow-xs space-y-4">
        <Skeleton className="h-6 w-64 rounded-md" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
