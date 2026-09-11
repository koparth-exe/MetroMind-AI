import React from 'react';
import { Skeleton } from '@/components/metro-shell';

export function SimulatorLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading Simulator Workbench">
      {/* Header Skeleton */}
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-8 w-80 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-xl rounded" />
      </div>

      {/* Hero Cards Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-2">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-7 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Main 2-Column Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="rounded-xl border border-border/40 bg-card/40 p-5 space-y-4">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border/40 bg-card/40 p-5 space-y-4">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
