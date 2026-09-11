import React from 'react';

export const AnalysisLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse pb-16" aria-busy="true" aria-label="Loading statistical intelligence data">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 bg-muted/60 rounded" />
            <div className="h-4 w-4 bg-muted/40 rounded-full" />
            <div className="h-4 w-28 bg-muted/60 rounded" />
          </div>
          <div className="h-9 w-72 bg-muted/80 rounded-md" />
          <div className="h-4 w-96 max-w-full bg-muted/50 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-44 bg-muted/50 rounded-lg" />
          <div className="h-9 w-24 bg-muted/50 rounded-lg" />
        </div>
      </div>

      {/* Primary Headline Signal Skeleton */}
      <div className="rounded-xl border border-border/50 bg-card/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-40 bg-muted/70 rounded" />
          <div className="h-5 w-28 bg-muted/50 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-background/60 border border-border/30 space-y-3">
              <div className="h-3 w-24 bg-muted/50 rounded" />
              <div className="h-8 w-20 bg-muted/80 rounded" />
              <div className="h-3 w-32 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Correlation & Regression 2-Column Bento Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Correlation Section Skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/40 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 bg-muted/70 rounded" />
            <div className="h-4 w-20 bg-muted/40 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-background/50 rounded-lg border border-border/20 p-3 flex items-center justify-between">
                <div className="h-4 w-24 bg-muted/60 rounded" />
                <div className="h-3 w-36 bg-muted/40 rounded" />
                <div className="h-4 w-12 bg-muted/70 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Regression Section Skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/40 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-5 w-44 bg-muted/70 rounded" />
            <div className="h-4 w-24 bg-muted/40 rounded" />
          </div>
          <div className="h-16 bg-background/50 rounded-lg border border-border/20 p-4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-background/50 rounded-lg border border-border/20" />
            <div className="h-20 bg-background/50 rounded-lg border border-border/20" />
          </div>
          <div className="h-24 bg-background/40 rounded-lg border border-border/20" />
        </div>
      </div>

      {/* Temporal Periodicity Skeleton */}
      <div className="rounded-xl border border-border/50 bg-card/40 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-52 bg-muted/70 rounded" />
          <div className="h-5 w-32 bg-muted/40 rounded-full" />
        </div>
        <div className="h-48 bg-background/50 rounded-lg border border-border/20 flex items-end gap-3 p-4">
          {[40, 75, 55, 90, 60, 45, 80, 35].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-muted/40 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Model Evidence Skeleton */}
      <div className="rounded-xl border border-border/50 bg-card/40 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-muted/70 rounded" />
          <div className="h-4 w-28 bg-muted/40 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-background/50 rounded-lg border border-border/20 p-4 space-y-3">
              <div className="h-4 w-28 bg-muted/70 rounded" />
              <div className="h-7 w-20 bg-muted/80 rounded" />
              <div className="h-3 w-36 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
