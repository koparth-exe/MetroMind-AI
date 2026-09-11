import { useState, useMemo } from 'react';
import { useGetDashboard, useGetDataSummary } from '@workspace/api-client-react';
import type { Dashboard, DataSummary } from '@workspace/api-client-react';
import { useTransportMode, QueryState } from '@/components/metro-shell';
import { demoDashboard, demoBusDashboard, demoSummary, demoBusSummary } from './demo-data';
import type { OverviewTelemetry } from './types';

import { OverviewHero } from './overview-hero';
import { OverviewMetrics } from './overview-metrics';
import { OverviewDemandChart } from './overview-demand-chart';
import { OverviewRiskDistribution } from './overview-risk-distribution';
import { OverviewRouteAttention } from './overview-route-attention';
import { OverviewSpatialPanel } from './overview-spatial-panel';
import { OverviewIntelligenceSignal } from './overview-intelligence-signal';
import { OverviewNextActions } from './overview-next-actions';

export function OverviewPage() {
  const { transportMode } = useTransportMode();
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  // API Queries
  const dashboardQuery = useGetDashboard(transportMode);
  const summaryQuery = useGetDataSummary(transportMode);

  // Fallbacks
  const fallbackDashboard: Dashboard = transportMode === 'BUS' ? demoBusDashboard : demoDashboard;
  const fallbackSummary: DataSummary = transportMode === 'BUS' ? demoBusSummary : demoSummary;

  const dashboard = dashboardQuery.data ?? fallbackDashboard;
  const summary = summaryQuery.data ?? fallbackSummary;

  const isBus = transportMode === 'BUS';
  const fleetUnitLabel = isBus ? 'buses' : 'train sets';

  // Compute key telemetry summary from actual data
  const telemetry: OverviewTelemetry = useMemo(() => {
    let peakDem = 0;
    let peakHr = '08:00';
    if (dashboard.trend && dashboard.trend.length > 0) {
      dashboard.trend.forEach((t) => {
        if (t.demand > peakDem) {
          peakDem = t.demand;
          peakHr = t.label;
        }
      });
    }

    // Evening crest calculation (16:00 to 21:00)
    let evePeakDem = 0;
    let evePeakHr: string | null = null;
    let eveDelta: string | null = null;

    if (dashboard.trend && dashboard.trend.length > 0) {
      const eveningItems = dashboard.trend.filter((t) => {
        const h = parseInt(t.label.split(':')[0], 10);
        return h >= 16 && h <= 21;
      });
      if (eveningItems.length > 0) {
        const evePeak = eveningItems.reduce(
          (max, cur) => (cur.demand > max.demand ? cur : max),
          eveningItems[0]
        );
        evePeakDem = evePeak.demand;
        evePeakHr = evePeak.label;
        if (evePeak.baseline && evePeak.baseline > 0) {
          const pct = ((evePeak.demand - evePeak.baseline) / evePeak.baseline) * 100;
          eveDelta = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
        }
      }
    }

    // Morning crest calculation (06:00 to 11:00)
    let mornPeakDem = 0;
    let mornPeakHr = '08:00';
    if (dashboard.trend && dashboard.trend.length > 0) {
      const morningItems = dashboard.trend.filter((t) => {
        const h = parseInt(t.label.split(':')[0], 10);
        return h >= 6 && h <= 11;
      });
      if (morningItems.length > 0) {
        const mornPeak = morningItems.reduce(
          (max, cur) => (cur.demand > max.demand ? cur : max),
          morningItems[0]
        );
        mornPeakDem = mornPeak.demand;
        mornPeakHr = mornPeak.label;
      }
    }

    // Stations count calculation: from summary or aggregated routes
    const stationCount =
      summary?.stations ??
      dashboard.routes.reduce((acc, r) => acc + (r.stations?.length ?? 0), 0) ??
      (isBus ? 16 : 15);

    // Calculate authoritative average utilization dynamically across routes
    const calculatedAverageUtilization =
      dashboard.routes && dashboard.routes.length > 0
        ? dashboard.routes.reduce((acc, r) => {
            const util = typeof r.utilization === 'number' ? r.utilization : 0;
            return acc + util;
          }, 0) / dashboard.routes.length
        : 0;

    return {
      records: summary?.records ?? 2688,
      stations: stationCount,
      routesCount: dashboard.routes.length,
      totalPredictedDemand: dashboard.totalPredictedDemand,
      peakDemand: peakDem,
      peakHour: peakHr,
      morningPeakHour: mornPeakHr,
      eveningPeakHour: evePeakHr,
      eveningPeakDeltaPct: eveDelta,
      averageUtilization: calculatedAverageUtilization,
      averageRisk: dashboard.averageRisk,
      highRiskCount: dashboard.highRiskRoutes,
      availableFleet: dashboard.availableBuses,
      recommendedAdditionalFleet: dashboard.recommendedAdditionalBuses,
      fleetUnitLabel,
      datasetName: summary?.datasetName ?? (isBus ? 'BEST_TRANSIT_2026' : 'MMR_TRANSIT_2026'),
    };
  }, [dashboard, summary, isBus, fleetUnitLabel]);

  const handleRefresh = () => {
    dashboardQuery.refetch();
    summaryQuery.refetch();
  };

  const isRefreshing = dashboardQuery.isFetching || summaryQuery.isFetching;
  const isFallback = !dashboardQuery.data || dashboardQuery.isError;

  return (
    <div className="space-y-6 lg:space-y-7 animate-page-enter">
      {/* 1. Hero / Network Context Strip */}
      <OverviewHero
        transportMode={transportMode}
        datasetName={telemetry.datasetName}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        systemStatus={isFallback ? 'FALLBACK / DEMO' : 'OPERATIONAL'}
      />

      {/* Query error alert if any */}
      {(dashboardQuery.isError || summaryQuery.isError) && (
        <div className="mb-4">
          <QueryState
            loading={false}
            error={true}
            retry={handleRefresh}
          />
        </div>
      )}

      {/* 2. Key Network Telemetry Metrics (5-Signal Row) */}
      <OverviewMetrics
        telemetry={telemetry}
        transportMode={transportMode}
      />

      {/* 3. Primary Analytical Grid (Dominant Demand + Risk Distribution) */}
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <OverviewDemandChart
          trend={dashboard.trend}
          transportMode={transportMode}
        />
        <OverviewRiskDistribution
          riskDistribution={dashboard.riskDistribution}
          totalRoutes={dashboard.routes.length}
          averageUtilization={telemetry.averageUtilization}
          averageRisk={telemetry.averageRisk}
        />
      </div>

      {/* 4. Spatial & Operational Grid (Route Attention Watchlist + Mumbai Map) */}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1.35fr]">
        <OverviewRouteAttention
          routes={dashboard.routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => setSelectedRouteId(id === selectedRouteId ? '' : id)}
          transportMode={transportMode}
        />
        <OverviewSpatialPanel
          routes={dashboard.routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => setSelectedRouteId(id === selectedRouteId ? '' : id)}
          transportMode={transportMode}
        />
      </div>

      {/* 5. Intelligence Signal Briefing & Recent Audit Log */}
      <OverviewIntelligenceSignal
        routes={dashboard.routes}
        activity={dashboard.activity}
        availableFleet={dashboard.availableBuses}
        recommendedAdditionalFleet={dashboard.recommendedAdditionalBuses}
        fleetUnitLabel={fleetUnitLabel}
        transportMode={transportMode}
      />

      {/* 6. Command Center Workflow Dispatch */}
      <OverviewNextActions />
    </div>
  );
}
