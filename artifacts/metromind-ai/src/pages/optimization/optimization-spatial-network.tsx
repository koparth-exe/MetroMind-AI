import { useMemo, useState } from 'react';
import { Panel } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';
import { getModeNomenclature, type BeforeAfterRouteComparison } from './types';
import { Info, Box, Layers, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface OptimizationSpatialNetworkProps {
  transportMode: TransportMode;
  rows: BeforeAfterRouteComparison[];
  isSolved: boolean;
}

/**
 * Generates polygon coordinates for a true 3D isometric block.
 * cx, cy: center point of the base
 * w: width, d: depth, h: vertical thickness
 */
function getIsoBlockPolygons(cx: number, cy: number, w: number, d: number, h: number) {
  const top = [
    [cx, cy - h - d],
    [cx + w / 2, cy - h - d / 2],
    [cx, cy - h],
    [cx - w / 2, cy - h - d / 2],
  ]
    .map(([x, y]) => `${Math.round(x)},${Math.round(y)}`)
    .join(' ');

  const left = [
    [cx - w / 2, cy - h - d / 2],
    [cx, cy - h],
    [cx, cy],
    [cx - w / 2, cy - d / 2],
  ]
    .map(([x, y]) => `${Math.round(x)},${Math.round(y)}`)
    .join(' ');

  const right = [
    [cx, cy - h],
    [cx + w / 2, cy - h - d / 2],
    [cx + w / 2, cy - d / 2],
    [cx, cy],
  ]
    .map(([x, y]) => `${Math.round(x)},${Math.round(y)}`)
    .join(' ');

  return { top, left, right };
}

export function OptimizationSpatialNetwork({
  transportMode,
  rows,
  isSolved,
}: OptimizationSpatialNetworkProps) {
  const mode = getModeNomenclature(transportMode);
  const [allocationMode, setAllocationMode] = useState<'recommended' | 'baseline'>('recommended');
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);

  // Active view: RECOMMENDED if solved and toggled; otherwise CURRENT (baseline)
  const activeView = isSolved ? allocationMode : 'baseline';

  // Geographic normalization that preserves true geographic aspect ratio and tightly fills 78-85% of viewport
  const svgData = useMemo(() => {
    const allCoords = rows.flatMap((r) => r.coordinates);
    if (allCoords.length === 0) return { corridors: [], maxNetworkDemand: 1, nominalUnitCap: 1 };

    const lats = allCoords.map((c) => c[0]);
    const lons = allCoords.map((c) => c[1]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latSpan = maxLat - minLat || 0.001;
    const lonSpan = maxLon - minLon || 0.001;

    // Real geographic aspect ratio for Mumbai (~19°N: 1 deg lon = cos(19°) deg lat ≈ 0.945 deg lat)
    const geoAspect = (lonSpan * 0.945) / latSpan;

    // Viewbox layout dimensions (640 x 450)
    const vbWidth = 640;
    const vbHeight = 450;
    const maxW = 530;
    const maxH = 370;

    let fitW: number;
    let fitH: number;

    if (maxW / maxH > geoAspect) {
      fitH = maxH;
      fitW = Math.round(maxH * geoAspect);
    } else {
      fitW = maxW;
      fitH = Math.round(maxW / geoAspect);
    }

    const startX = Math.round((vbWidth - fitW) / 2);
    const startY = Math.round((vbHeight - fitH) / 2) + 15; // slight downward bias for vertical 3D headroom

    const maxNetworkDemand = Math.max(1, ...rows.map((r) => r.predictedDemand));
    const nominalUnitCap = mode.defaultCapacity;

    const corridors = rows.map((r) => {
      // Ground points (P_base)
      const basePoints = r.coordinates.map(([lat, lon]) => {
        const normX = (lon - minLon) / lonSpan;
        const normY = (maxLat - lat) / latSpan;
        const x = Math.round(startX + normX * fitW);
        const y = Math.round(startY + normY * fitH);
        return { x, y };
      });

      // Operational allocation state
      const vehicles = activeView === 'recommended' ? r.recommendedBuses : r.baselineBuses;
      const capacity = activeView === 'recommended' ? r.recommendedCapacity : r.baselineCapacity;
      const utilization = activeView === 'recommended' ? r.recommendedUtilization : r.baselineUtilization;
      const isOvercrowded = (activeView === 'recommended' ? r.recommendedOvercrowding : r.baselineOvercrowding) > 0;
      const isZeroVeh = r.isZeroVehicleRoute && activeView === 'recommended';

      // Semantic Z-Axis: Extrusion height is proportional to allocated capacity / vehicle quota
      // Zero vehicles = 0px (flat on ground); 1-4 vehicles elevate 12px to 36px
      const extrusionHeight = isZeroVeh ? 0 : Math.round(10 + vehicles * 6.5);

      // Elevated points (P_elevated = P_base with y - extrusionHeight)
      const elevatedPoints = basePoints.map((pt) => ({
        x: pt.x,
        y: pt.y - extrusionHeight,
      }));

      // Base footprint path string
      const basePathData = basePoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');

      // Elevated top deck path string
      const elevatedPathData = elevatedPoints.reduce(
        (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`,
        ''
      );

      // Extruded corridor side walls (connecting base to elevated deck)
      const wallPolygons: string[] = [];
      if (extrusionHeight > 0) {
        for (let i = 0; i < basePoints.length - 1; i++) {
          const p1 = basePoints[i];
          const p2 = basePoints[i + 1];
          const ep1 = elevatedPoints[i];
          const ep2 = elevatedPoints[i + 1];
          wallPolygons.push(`${p1.x},${p1.y} ${p2.x},${p2.y} ${ep2.x},${ep2.y} ${ep1.x},${ep1.y}`);
        }
      }

      // Anchor point for stacked allocation blocks (station nearest mid-corridor)
      const anchorIdx = Math.min(basePoints.length - 1, Math.max(0, Math.floor(basePoints.length / 2)));
      const baseAnchor = basePoints[anchorIdx] ?? { x: 300, y: 220 };
      const elevatedAnchor = elevatedPoints[anchorIdx] ?? { x: 300, y: 220 };

      // Generate isometric allocation blocks (1 block per allocated vehicle)
      const blockWidth = 22;
      const blockDepth = 11;
      const blockThickness = 6.5;
      const blockStackOffset = 8.5;

      const allocationBlocks = [];
      if (!isZeroVeh && vehicles > 0) {
        for (let v = 0; v < vehicles; v++) {
          // Stack blocks vertically starting at elevated anchor
          const blockCenterY = elevatedAnchor.y - 4 - v * blockStackOffset;
          const polys = getIsoBlockPolygons(
            elevatedAnchor.x,
            blockCenterY,
            blockWidth,
            blockDepth,
            blockThickness
          );
          allocationBlocks.push({ index: v, ...polys, centerY: blockCenterY });
        }
      }

      // Demand Level Marker: Normalized height representing predicted demand
      // Normalized against nominal unit capacity
      const normalizedDemandRatio = r.predictedDemand / (nominalUnitCap || 1);
      const demandVisualHeight = Math.round(Math.min(48, Math.max(4, normalizedDemandRatio * 18)));
      const demandMarkerY = baseAnchor.y - demandVisualHeight;

      // Headroom vs Deficit
      const hasHeadroom = capacity >= r.predictedDemand;
      const headroomAmount = Math.max(0, Math.round(capacity - r.predictedDemand));
      const deficitAmount = Math.max(0, Math.round(r.predictedDemand - capacity));

      // Terminus station badge placement
      const terminus = basePoints[basePoints.length - 1] ?? { x: 300, y: 200 };
      const elevatedTerminus = elevatedPoints[elevatedPoints.length - 1] ?? { x: 300, y: 200 };
      const terminusStationName = r.stations[r.stations.length - 1] ?? r.name;

      const offsetX = terminus.x > vbWidth / 2 ? 20 : -20;
      const offsetY = terminus.y < vbHeight / 2 ? -18 : 18;

      return {
        routeId: r.routeId,
        name: r.name,
        color: r.color,
        stations: r.stations,
        basePoints,
        elevatedPoints,
        basePathData,
        elevatedPathData,
        wallPolygons,
        extrusionHeight,
        vehicles,
        capacity,
        utilization,
        isOvercrowded,
        demand: r.predictedDemand,
        isZeroVeh,
        allocationBlocks,
        baseAnchor,
        elevatedAnchor,
        demandMarkerY,
        hasHeadroom,
        headroomAmount,
        deficitAmount,
        terminus,
        elevatedTerminus,
        terminusStationName,
        badgeX: elevatedTerminus.x + offsetX,
        badgeY: elevatedTerminus.y + offsetY,
      };
    });

    return { corridors, maxNetworkDemand, nominalUnitCap };
  }, [rows, activeView, mode.defaultCapacity]);

  const { corridors } = svgData;

  return (
    <div id="optimization-spatial-network">
      <Panel
        title="2.5D Allocation Blueprint"
        meta="SPATIAL NETWORK · FLEET QUOTAS"
        action={
          <div className="flex items-center gap-2">
            {isSolved && (
              <div
                className="inline-flex rounded-lg border border-border/80 bg-background/80 p-0.5 text-[10.5px] font-mono-ui"
                role="tablist"
                aria-label="Spatial allocation view selector"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'baseline'}
                  onClick={() => setAllocationMode('baseline')}
                  className={`rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                    activeView === 'baseline'
                      ? 'bg-muted text-foreground font-bold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  CURRENT
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'recommended'}
                  onClick={() => setAllocationMode('recommended')}
                  className={`rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                    activeView === 'recommended'
                      ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  RECOMMENDED
                </button>
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {/* True 2.5D Blueprint Viewport Container */}
          <div className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-b from-card/95 via-card/85 to-background/95 p-2 sm:p-4 shadow-inner">
            {/* Coordinate Grid Floor Matrix */}
            <div className="absolute inset-0 grid-paper opacity-25 pointer-events-none" />

            {/* Subtle Isometric Depth Container with Reduced-Motion Safety */}
            <div className="relative h-[380px] sm:h-[430px] w-full flex items-center justify-center [perspective:1200px]">
              <svg
                viewBox="0 0 640 450"
                className="h-full w-full select-none transition-transform duration-300 ease-out md:[transform:rotateX(5deg)_rotateZ(-1deg)]"
                role="img"
                aria-label={`2.5D Allocation Blueprint for ${mode.networkTitle}. Corridors feature 3D extruded capacity walls and stacked allocation quota blocks.`}
              >
                <defs>
                  {/* Subtle Ribbon Glow Filter */}
                  <filter id="corridor-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Ground Ambient Occlusion Filter */}
                  <filter id="ground-shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                  </filter>
                </defs>

                {/* LAYER 0: Ground Footprint Shadows */}
                {corridors.map((c) => (
                  <path
                    key={`ground-shadow-${c.routeId}`}
                    d={c.basePathData}
                    fill="none"
                    stroke="hsl(var(--card-border) / 0.45)"
                    strokeWidth={c.isZeroVeh ? 3 : 8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#ground-shadow)"
                    transform="translate(2, 6)"
                  />
                ))}

                {/* LAYER 0B: Ground Base Lines */}
                {corridors.map((c) => (
                  <path
                    key={`ground-line-${c.routeId}`}
                    d={c.basePathData}
                    fill="none"
                    stroke="hsl(var(--muted-foreground) / 0.3)"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={c.isZeroVeh ? '4 4' : '2 2'}
                  />
                ))}

                {/* LAYER 1: Extruded 3D Side Walls (Connecting Ground to Elevated Deck) */}
                {corridors.map((c) => {
                  const isHovered = hoveredRouteId === c.routeId;
                  if (c.extrusionHeight === 0) return null;

                  return (
                    <g
                      key={`extrusion-walls-${c.routeId}`}
                      opacity={hoveredRouteId && !isHovered ? 0.3 : 0.85}
                      className="transition-opacity duration-200"
                    >
                      {c.wallPolygons.map((poly, idx) => (
                        <polygon
                          key={`wall-${c.routeId}-${idx}`}
                          points={poly}
                          fill={c.color}
                          fillOpacity={0.22}
                          stroke={c.color}
                          strokeWidth={1}
                          strokeOpacity={0.6}
                          strokeLinejoin="round"
                        />
                      ))}
                    </g>
                  );
                })}

                {/* LAYER 2: Elevated Corridor Decks & Station Nodes */}
                {corridors.map((c) => {
                  const isHovered = hoveredRouteId === c.routeId;
                  return (
                    <g
                      key={`elevated-deck-${c.routeId}`}
                      onMouseEnter={() => setHoveredRouteId(c.routeId)}
                      onMouseLeave={() => setHoveredRouteId(null)}
                      onMouseOver={() => setHoveredRouteId(c.routeId)}
                      onMouseOut={() => setHoveredRouteId(null)}
                      onFocus={() => setHoveredRouteId(c.routeId)}
                      onBlur={() => setHoveredRouteId(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${c.routeId} ${c.name}, ${c.vehicles} ${mode.vehiclePlural} allocated`}
                      className="cursor-pointer transition-opacity duration-200 outline-none"
                      opacity={hoveredRouteId && !isHovered ? 0.35 : 1}
                    >
                      {/* Elevated Capacity Deck Polyline */}
                      <path
                        d={c.elevatedPathData}
                        fill="none"
                        stroke={c.color}
                        strokeWidth={c.isZeroVeh ? 2.5 : Math.min(12, Math.max(5, c.vehicles * 3.8))}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={c.isZeroVeh ? '6 6' : undefined}
                        opacity={c.isZeroVeh ? 0.4 : isHovered ? 1 : 0.9}
                        filter={isHovered ? 'url(#corridor-glow)' : undefined}
                      />

                      {/* Core Spine Alignment Line */}
                      <path
                        d={c.elevatedPathData}
                        fill="none"
                        stroke="hsl(var(--background))"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.7}
                      />

                      {/* Elevated Station Nodes */}
                      {c.elevatedPoints.map((pt, i) => (
                        <g key={`${c.routeId}-node-${i}`}>
                          {/* Vertical Pin line dropping to ground for terminal stations */}
                          {(i === 0 || i === c.elevatedPoints.length - 1) && c.extrusionHeight > 4 && (
                            <line
                              x1={pt.x}
                              y1={pt.y}
                              x2={c.basePoints[i].x}
                              y2={c.basePoints[i].y}
                              stroke={c.color}
                              strokeWidth={1}
                              strokeDasharray="2 2"
                              opacity={0.5}
                            />
                          )}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={i === 0 || i === c.elevatedPoints.length - 1 ? 5 : 3.2}
                            fill={c.color}
                            stroke="hsl(var(--card))"
                            strokeWidth={1.5}
                          />
                        </g>
                      ))}

                      {/* LAYER 3: Stacked Isometric Allocation Blocks (1 Block = 1 Vehicle Quota) */}
                      {!c.isZeroVeh && c.allocationBlocks.length > 0 && (
                        <g key={`block-stack-${c.routeId}`}>
                          {/* Anchor base ring */}
                          <ellipse
                            cx={c.elevatedAnchor.x}
                            cy={c.elevatedAnchor.y + 4}
                            rx={14}
                            ry={7}
                            fill="none"
                            stroke={c.color}
                            strokeWidth={1}
                            strokeDasharray="2 2"
                            opacity={0.6}
                          />

                          {/* Stacked 3D Isometric Slabs */}
                          {c.allocationBlocks.map((block) => (
                            <g
                              key={`block-${c.routeId}-${block.index}`}
                              className="transition-transform duration-300 ease-out"
                            >
                              {/* Left Face (medium shade) */}
                              <polygon
                                points={block.left}
                                fill={c.color}
                                fillOpacity={0.65}
                                stroke="hsl(var(--background))"
                                strokeWidth={0.8}
                              />
                              {/* Right Face (dark shade) */}
                              <polygon
                                points={block.right}
                                fill={c.color}
                                fillOpacity={0.45}
                                stroke="hsl(var(--background))"
                                strokeWidth={0.8}
                              />
                              {/* Top Face (light highlight) */}
                              <polygon
                                points={block.top}
                                fill={c.color}
                                fillOpacity={0.92}
                                stroke="hsl(var(--background))"
                                strokeWidth={0.8}
                              />
                            </g>
                          ))}

                          {/* Top Quota Count Label */}
                          <text
                            x={c.elevatedAnchor.x}
                            y={c.allocationBlocks[c.allocationBlocks.length - 1].centerY - 12}
                            textAnchor="middle"
                            fill="hsl(var(--foreground))"
                            className="font-mono-ui text-[9px] font-bold select-none drop-shadow-sm"
                          >
                            {c.vehicles} {c.vehicles === 1 ? mode.vehicleSingular : mode.vehiclePlural}
                          </text>
                        </g>
                      )}

                      {/* LAYER 3B: Demand vs Capacity Gauge Needle */}
                      {!c.isZeroVeh && (
                        <g
                          key={`demand-gauge-${c.routeId}`}
                          transform={`translate(${c.elevatedAnchor.x + 22}, ${c.elevatedAnchor.y})`}
                          className="select-none"
                        >
                          {/* Vertical Reference Track */}
                          <line
                            x1={0}
                            y1={0}
                            x2={0}
                            y2={-36}
                            stroke="hsl(var(--border))"
                            strokeWidth={1}
                            strokeDasharray="1 2"
                          />

                          {/* Predicted Demand Level Marker */}
                          <g transform={`translate(0, ${c.demandMarkerY - c.elevatedAnchor.y})`}>
                            <line
                              x1={-3}
                              y1={0}
                              x2={4}
                              y2={0}
                              stroke={c.hasHeadroom ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                              strokeWidth={2}
                            />
                            <circle
                              cx={5}
                              cy={0}
                              r={2}
                              fill={c.hasHeadroom ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                            />
                          </g>

                          {/* Capacity Level Tick */}
                          <line x1={-3} y1={-c.extrusionHeight / 2} x2={3} y2={-c.extrusionHeight / 2} stroke={c.color} strokeWidth={1.5} />
                        </g>
                      )}

                      {/* Zero Service Ground Flag */}
                      {c.isZeroVeh && (
                        <g transform={`translate(${c.baseAnchor.x}, ${c.baseAnchor.y})`}>
                          <circle cx={0} cy={0} r={8} fill="hsl(var(--destructive) / 0.15)" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="3 2" />
                          <text x={0} y={16} textAnchor="middle" fill="hsl(var(--destructive))" className="font-mono-ui text-[8.5px] font-bold">
                            NO SERVICE
                          </text>
                        </g>
                      )}

                      {/* LAYER 4: Terminus Destination & Allocation Badge */}
                      <g transform={`translate(${c.badgeX}, ${c.badgeY})`}>
                        <rect
                          x="-48"
                          y="-11"
                          width="96"
                          height="22"
                          rx="6"
                          fill="hsl(var(--card))"
                          stroke={isHovered ? c.color : 'hsl(var(--border))'}
                          strokeWidth={isHovered ? 2 : 1}
                          className="filter drop-shadow-sm"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill={c.isZeroVeh ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))'}
                          className="font-mono-ui text-[9px] font-bold select-none"
                        >
                          {c.routeId} · {c.isZeroVeh ? 'NO SERVICE' : `${c.vehicles} ${mode.vehiclePlural}`}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Compact Dimensional Legend Bar */}
            <div className="mt-2 pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-[10.5px] font-mono-ui text-muted-foreground px-1">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-sm bg-primary/40 border border-primary" />
                  <span>3D Extruded Deck (Capacity)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Box size={12} className="text-primary" />
                  <span>Stacked Slabs (Vehicle Quota)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Tick: Demand Marker</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="inline-flex items-center gap-1 text-risk-low">
                  <CheckCircle2 size={11} /> Headroom (+cap)
                </span>
                <span className="inline-flex items-center gap-1 text-destructive">
                  <AlertTriangle size={11} /> Deficit (-seats)
                </span>
              </div>
            </div>

            {/* Interactive Real-Time Hover/Focus Telemetry HUD */}
            {hoveredRouteId && (
              <div className="absolute bottom-11 left-3 right-3 z-10 rounded-lg border border-border/80 bg-background/95 p-2.5 font-mono-ui text-xs text-foreground shadow-sm flex flex-wrap items-center justify-between gap-2 pointer-events-none animate-in fade-in duration-150">
                {(() => {
                  const target = corridors.find((c) => c.routeId === hoveredRouteId);
                  if (!target) return null;
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: target.color }} />
                        <span className="font-bold">
                          {target.routeId} · {target.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">({target.terminusStationName})</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                        <span>
                          Demand: <strong className="text-foreground">{Math.round(target.demand)} pax/h</strong>
                        </span>
                        <span>
                          Quota:{' '}
                          <strong className={target.isZeroVeh ? 'text-destructive' : 'text-foreground'}>
                            {target.isZeroVeh ? '0 (NO SERVICE)' : `${target.vehicles} ${mode.vehiclePlural}`}
                          </strong>
                        </span>
                        <span>
                          Capacity:{' '}
                          <strong className="text-foreground">{target.capacity.toLocaleString()} seats</strong>
                        </span>
                        <span>
                          Balance:{' '}
                          {target.isZeroVeh ? (
                            <strong className="text-destructive">Unserved {Math.round(target.demand)} pax</strong>
                          ) : target.hasHeadroom ? (
                            <strong className="text-risk-low">+{target.headroomAmount} headroom</strong>
                          ) : (
                            <strong className="text-destructive">-{target.deficitAmount} deficit</strong>
                          )}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Essential Non-Movement Disclaimer Notice */}
          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            <Info size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Allocation blueprint:</strong> Visualizes fleet quotas and capacity coverage, not real-time vehicle movement.
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
