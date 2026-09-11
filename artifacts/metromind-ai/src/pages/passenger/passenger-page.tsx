import { useState, useMemo } from 'react';
import { useGetDashboard, useGetDataSummary, useGetRoutes } from '@workspace/api-client-react';
import type { Dashboard, DataSummary, RouteInsight } from '@workspace/api-client-react';
import { useTransportMode, QueryState } from '@/components/metro-shell';
import { demoDashboard, demoBusDashboard, demoSummary, demoBusSummary } from '../overview/demo-data';
import type { PassengerTelemetry, BusiestRouteInfo, InterchangeHubInfo } from './types';

import { PassengerHeader } from './passenger-header';
import { PassengerTelemetryRow } from './passenger-telemetry';
import { PassengerFlowChart } from './passenger-flow-chart';
import { PassengerCrowdingAnalysis } from './passenger-crowding-analysis';
import { PassengerCorridorRanking } from './passenger-corridor-ranking';
import { PassengerSpatialPanel } from './passenger-spatial-panel';
import { PassengerJourneyLookup } from './passenger-journey-lookup';
import { PassengerOperationalTakeaway } from './passenger-operational-takeaway';

export function PassengerPage() {
  const { transportMode } = useTransportMode();
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  // API Queries
  const dashboardQuery = useGetDashboard(transportMode);
  const summaryQuery = useGetDataSummary(transportMode);
  const routesQuery = useGetRoutes(transportMode);

  // Fallbacks
  const fallbackDashboard: Dashboard = transportMode === 'BUS' ? demoBusDashboard : demoDashboard;
  const fallbackSummary: DataSummary = transportMode === 'BUS' ? demoBusSummary : demoSummary;

  const dashboard = dashboardQuery.data ?? fallbackDashboard;
  const summary = summaryQuery.data ?? fallbackSummary;

  const isBus = transportMode === 'BUS';
  const fleetUnitLabel = isBus ? 'buses' : 'train sets';
  const vehicleCapacity = isBus ? 70 : 3000;

  // Compute key passenger flow telemetry from actual data
  const telemetry: PassengerTelemetry = useMemo(() => {
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

    // Morning peak window (06:00 to 11:00)
    let mornPeakDem = 0;
    let mornPeakHr = '08:00';
    if (dashboard.trend && dashboard.trend.length > 0) {
      const morningItems = dashboard.trend.filter((t) => {
        const h = parseInt(t.label.split(':')[0], 10);
        return h >= 6 && h <= 11;
      });
      if (morningItems.length > 0) {
        const mornPeak = morningItems.reduce((max, cur) => (cur.demand > max.demand ? cur : max), morningItems[0]);
        mornPeakDem = mornPeak.demand;
        mornPeakHr = mornPeak.label;
      }
    }

    // Evening peak window (16:00 to 21:00)
    let evePeakDem = 0;
    let evePeakHr = '18:00';
    if (dashboard.trend && dashboard.trend.length > 0) {
      const eveningItems = dashboard.trend.filter((t) => {
        const h = parseInt(t.label.split(':')[0], 10);
        return h >= 16 && h <= 21;
      });
      if (eveningItems.length > 0) {
        const evePeak = eveningItems.reduce((max, cur) => (cur.demand > max.demand ? cur : max), eveningItems[0]);
        evePeakDem = evePeak.demand;
        evePeakHr = evePeak.label;
      }
    }

    // Mean utilization across corridors
    const avgUtil =
      dashboard.routes && dashboard.routes.length > 0
        ? dashboard.routes.reduce((acc, r) => acc + (typeof r.utilization === 'number' ? r.utilization : 0), 0) /
          dashboard.routes.length
        : 0;

    // Busiest route
    const sortedByDemand = [...dashboard.routes].sort((a, b) => b.predictedDemand - a.predictedDemand);
    const topRoute = sortedByDemand[0];
    const busiest: BusiestRouteInfo = {
      routeId: topRoute?.routeId ?? (isBus ? 'B1' : 'R1'),
      name: topRoute?.name ?? (isBus ? 'Vashi–Dadar' : 'Central Line'),
      color: topRoute?.color ?? '#0284c7',
      demand: topRoute?.predictedDemand ?? 0,
      utilization: topRoute?.utilization ?? 0,
      crowdingLevel:
        topRoute?.utilization >= 1.0
          ? 'Critical'
          : topRoute?.utilization >= 0.85
          ? 'High'
          : topRoute?.utilization >= 0.70
          ? 'Moderate'
          : 'Low',
    };

    // Find key interchange hub station (appears in the most routes)
    const stationMap = new Map<string, string[]>();
    dashboard.routes.forEach((r) => {
      r.stations?.forEach((st) => {
        const existing = stationMap.get(st) ?? [];
        existing.push(r.routeId);
        stationMap.set(st, existing);
      });
    });

    let bestHub = isBus ? 'Vashi' : 'Kurla';
    let maxCorridors = 1;
    stationMap.forEach((corridors, stName) => {
      if (corridors.length > maxCorridors) {
        maxCorridors = corridors.length;
        bestHub = stName;
      }
    });

    const keyHub: InterchangeHubInfo = {
      name: bestHub,
      corridorCount: maxCorridors,
      corridorNames: stationMap.get(bestHub) ?? [isBus ? 'B1' : 'R1'],
    };

    const stationCount =
      summary?.stations ??
      dashboard.routes.reduce((acc, r) => acc + (r.stations?.length ?? 0), 0) ??
      (isBus ? 16 : 10);

    return {
      totalDemand: dashboard.totalPredictedDemand,
      peakDemand: peakDem,
      peakHour: peakHr,
      morningPeakDemand: mornPeakDem,
      morningPeakHour: mornPeakHr,
      eveningPeakDemand: evePeakDem,
      eveningPeakHour: evePeakHr,
      averageUtilization: avgUtil,
      busiestRoute: busiest,
      keyInterchangeHub: keyHub,
      datasetName:
        summary?.datasetName && !summary.isDemo && !summary.datasetName.includes('_DEMO')
          ? summary.datasetName
          : isBus
          ? 'BEST_TRANSIT_2026'
          : 'MMR_TRANSIT_2026',
      recordsCount: summary?.records ?? 2688,
      stationsCount: stationCount,
      corridorsCount: dashboard.routes.length,
      fleetUnitLabel,
      vehicleCapacity,
    };
  }, [dashboard, summary, isBus, fleetUnitLabel, vehicleCapacity]);

  const handleRefresh = () => {
    dashboardQuery.refetch();
    summaryQuery.refetch();
    routesQuery.refetch();
  };

  const isRefreshing = dashboardQuery.isFetching || summaryQuery.isFetching || routesQuery.isFetching;
  const isFallback = !dashboardQuery.data || dashboardQuery.isError;

  const selectedRouteName = useMemo(() => {
    return dashboard.routes.find((r) => r.routeId === selectedRouteId)?.name;
  }, [dashboard.routes, selectedRouteId]);

  return (
    <div className="space-y-6 lg:space-y-7 animate-page-enter">
      {/* 1. Header Context */}
      <PassengerHeader
        transportMode={transportMode}
        datasetName={telemetry.datasetName}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        systemStatus={isFallback ? 'FALLBACK / DEMO' : 'OPERATIONAL'}
        recordsCount={telemetry.recordsCount}
      />

      {/* Query error alert if any */}
      {(dashboardQuery.isError || summaryQuery.isError) && (
        <div className="mb-4">
          <QueryState loading={false} error={true} retry={handleRefresh} />
        </div>
      )}

      {/* 2. Key Passenger Telemetry Metrics (5-Signal Row) */}
      <PassengerTelemetryRow
        telemetry={telemetry}
        transportMode={transportMode}
      />

      {/* 3. Primary Analytical Grid (Diurnal Inflow Trajectory + Crowding & Headroom) */}
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <PassengerFlowChart
          trend={dashboard.trend}
          transportMode={transportMode}
          selectedRouteName={selectedRouteName}
        />
        <PassengerCrowdingAnalysis
          routes={dashboard.routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => setSelectedRouteId(id === selectedRouteId ? '' : id)}
          transportMode={transportMode}
        />
      </div>

      {/* 4. Spatial & Priority Ranking Grid (Corridor Ranking + Mumbai Map) */}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1.35fr]">
        <PassengerCorridorRanking
          routes={dashboard.routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => setSelectedRouteId(id === selectedRouteId ? '' : id)}
          transportMode={transportMode}
        />
        <PassengerSpatialPanel
          routes={dashboard.routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => setSelectedRouteId(id === selectedRouteId ? '' : id)}
          transportMode={transportMode}
        />
      </div>

      {/* 5. Journey Crowding Lookup (Interactive ML Departure Planning) */}
      <PassengerJourneyLookup
        routes={dashboard.routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={(id) => setSelectedRouteId(id)}
        transportMode={transportMode}
      />

      {/* 6. Operational Passenger Takeaway */}
      <PassengerOperationalTakeaway
        telemetry={telemetry}
        routes={dashboard.routes}
        transportMode={transportMode}
      />
    </div>
  );
}
