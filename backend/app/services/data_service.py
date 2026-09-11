"""Transport data service layer for MetroMind AI.

Maintains strictly isolated in-memory datasets for RAILWAY and BUS modes.
Provides route definitions, fleet capacity configurations, demo datasets,
and statistical summaries without predictive or optimization coupling.
"""

from datetime import datetime, timezone
import math
import threading

from app.domain.data.csv_validator import CsvDataValidator
from app.domain.data.demo import generate_demo_dataset
from app.domain.data.models import DataSummary, DatasetMetadata, DemandRecord
from app.domain.transport.enums import TransportMode
from app.domain.transport.fleet import (
    FleetConfig,
    capacity_for,
    fleet_for,
    get_fleet_config,
)
from app.domain.transport.registry import transport_registry
from app.domain.transport.routes import Route, get_routes_for_mode
from app.mathematics.risk.probability import calculate_overload_probability
from app.mathematics.risk.scoring import calculate_risk_score
from app.models.dashboard import (
    ActivityItem,
    DashboardResponse,
    HourlyTrendResponse,
    RiskDistributionItem,
    RouteInsightResponse,
)


_SUMMARY_COLUMNS = [
    "timestamp",
    "route_id",
    "station_id",
    "passenger_count",
    "day_of_week",
    "is_weekend",
    "is_holiday",
    "temperature",
    "rainfall",
    "special_event",
    "mode",
]


class _ModeStore:
    """Internal container for a single mode's dataset and metadata."""

    def __init__(self, mode: TransportMode) -> None:
        self.mode = mode
        self.dataset_name = f"MMR_TRANSIT_{mode.value}_DEMO"
        self.is_demo = True
        self.created_at = datetime.now(timezone.utc)
        self.records: list[DemandRecord] = generate_demo_dataset(mode)
        self.missing_values: int = 0
        self.invalid_values: int = 0


class TransportDataService:
    """Domain service managing mode-isolated transport datasets."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        # Strictly isolated data partitions by TransportMode key
        self._stores: dict[TransportMode, _ModeStore] = {
            mode: _ModeStore(mode) for mode in transport_registry.supported_modes()
        }

    def _get_store(self, mode: TransportMode | str) -> _ModeStore:
        """Resolve mode and return its dedicated store."""
        resolved_mode = transport_registry.require_mode(mode)
        return self._stores[resolved_mode]

    def get_routes(self, mode: TransportMode | str) -> tuple[Route, ...]:
        """Return canonical routes for the validated mode."""
        return get_routes_for_mode(mode)

    def get_fleet_config(self, mode: TransportMode | str) -> FleetConfig:
        """Return demo fleet capacity and sizing configuration for the validated mode."""
        return get_fleet_config(mode)

    def capacity_for(self, mode: TransportMode | str) -> int:
        """Return single-vehicle capacity for the validated mode."""
        return capacity_for(mode)

    def fleet_for(self, mode: TransportMode | str) -> int:
        """Return total active fleet count for the validated mode."""
        return fleet_for(mode)

    def get_demo_dataset(self, mode: TransportMode | str) -> tuple[DemandRecord, ...]:
        """Return current in-memory demand observations for the validated mode."""
        with self._lock:
            store = self._get_store(mode)
            return tuple(store.records)

    def get_dataset_metadata(self, mode: TransportMode | str) -> DatasetMetadata:
        """Return metadata for the active dataset of the validated mode."""
        with self._lock:
            store = self._get_store(mode)
            return DatasetMetadata(
                dataset_name=store.dataset_name,
                mode=store.mode,
                is_demo=store.is_demo,
                record_count=len(store.records),
                created_at=store.created_at,
            )

    def get_dataset_summary(self, mode: TransportMode | str) -> DataSummary:
        """Compute statistical and data quality summary for the validated mode."""
        with self._lock:
            store = self._get_store(mode)
            records = store.records

            if not records:
                return DataSummary(
                    dataset_name=store.dataset_name,
                    mode=store.mode,
                    is_demo=store.is_demo,
                    records=0,
                    routes=0,
                    stations=0,
                    missing_values=store.missing_values,
                    invalid_values=store.invalid_values,
                    date_start="—",
                    date_end="—",
                    average_demand=0.0,
                    max_demand=0,
                    quality="Empty dataset",
                    columns=_SUMMARY_COLUMNS,
                )

            counts = [r.passenger_count for r in records]
            distinct_routes = {r.route_id for r in records}
            distinct_stations = {r.station_id for r in records}

            sorted_timestamps = sorted(r.timestamp for r in records)
            date_start = sorted_timestamps[0].strftime("%Y-%m-%d")
            date_end = sorted_timestamps[-1].strftime("%Y-%m-%d")

            avg_demand = round(sum(counts) / len(counts), 1)
            max_demand = max(counts)

            quality = (
                "Excellent"
                if (store.invalid_values == 0 and store.missing_values == 0)
                else "Review required"
            )

            return DataSummary(
                dataset_name=store.dataset_name,
                mode=store.mode,
                is_demo=store.is_demo,
                records=len(records),
                routes=len(distinct_routes),
                stations=len(distinct_stations),
                missing_values=store.missing_values,
                invalid_values=store.invalid_values,
                date_start=date_start,
                date_end=date_end,
                average_demand=avg_demand,
                max_demand=max_demand,
                quality=quality,
                columns=_SUMMARY_COLUMNS,
            )

    def reset_demo(self, mode: TransportMode | str) -> DataSummary:
        """Reset the specified mode's in-memory store to its synthetic demo dataset.

        Does NOT mutate or affect any other mode's dataset.
        """
        resolved_mode = transport_registry.require_mode(mode)
        with self._lock:
            self._stores[resolved_mode] = _ModeStore(resolved_mode)
        return self.get_dataset_summary(resolved_mode)

    def load_custom_dataset(self, mode: TransportMode | str, csv_text: str) -> DataSummary:
        """Parse and validate CSV text into the specified mode's in-memory store."""
        resolved_mode = transport_registry.require_mode(mode)
        validator = CsvDataValidator(target_mode=resolved_mode)
        res = validator.validate_csv(csv_text)
        if not res.is_valid:
            err_msg = res.errors[0].message if res.errors else "CSV validation failed."
            raise ValueError(f"Invalid CSV: {err_msg}")

        with self._lock:
            store = self._get_store(resolved_mode)
            store.records = res.records
            store.is_demo = False
            store.dataset_name = f"MMR_{resolved_mode.value}_CUSTOM"
            store.missing_values = res.missing_values_count
            store.invalid_values = res.invalid_count

        return self.get_dataset_summary(resolved_mode)

    def get_dashboard(self, mode: TransportMode | str) -> DashboardResponse:
        """Compute the operational dashboard summary for the specified transport mode."""
        resolved_mode = transport_registry.require_mode(mode)
        routes = self.get_routes(resolved_mode)
        fleet_cfg = self.get_fleet_config(resolved_mode)
        records = list(self.get_demo_dataset(resolved_mode))

        if not records:
            raise ValueError(f"No dataset records available for mode '{resolved_mode.value}'.")

        route_records: dict[str, list[DemandRecord]] = {r.route_id: [] for r in routes}
        for rec in records:
            if rec.route_id in route_records:
                route_records[rec.route_id].append(rec)

        v_cap = fleet_cfg.vehicle_capacity

        all_counts = [r.passenger_count for r in records]
        mean_all = sum(all_counts) / max(1, len(all_counts))
        variance_all = sum((x - mean_all) ** 2 for x in all_counts) / max(1, len(all_counts) - 1)
        mode_sigma = max(1.0, math.sqrt(variance_all) * 0.15)

        route_insights: list[RouteInsightResponse] = []
        for route in routes:
            recs = route_records.get(route.route_id, [])
            hist_avg = round(sum(r.passenger_count for r in recs) / max(1, len(recs)), 1)
            pred_demand = round(hist_avg * 1.12, 1)
            baseline_buses = 1
            capacity = baseline_buses * v_cap
            utilization = round(pred_demand / max(1, capacity), 3)

            overcrowding_prob = round(calculate_overload_probability(pred_demand, capacity, mode_sigma), 3)
            score_res = calculate_risk_score(utilization, overcrowding_prob)
            risk_level_str = score_res.risk_level.value.capitalize()
            rec_buses = max(1, math.ceil(pred_demand / (v_cap * 0.90)))

            route_insights.append(
                RouteInsightResponse(
                    route_id=route.route_id,
                    name=route.name,
                    color=route.color,
                    predicted_demand=pred_demand,
                    historical_average=hist_avg,
                    capacity=capacity,
                    utilization=utilization,
                    overcrowding_probability=overcrowding_prob,
                    risk=risk_level_str,
                    recommended_buses=rec_buses,
                    baseline_buses=baseline_buses,
                    stations=route.stations,
                    coordinates=route.coordinates,
                )
            )

        hourly_buckets: dict[int, list[int]] = {h: [] for h in range(24)}
        for rec in records:
            hourly_buckets[rec.timestamp.hour].append(rec.passenger_count)

        trend: list[HourlyTrendResponse] = []
        for h in range(24):
            b = hourly_buckets[h]
            avg_h = round(sum(b) / max(1, len(b)), 1)
            base_h = round(avg_h * 0.91, 1)
            trend.append(
                HourlyTrendResponse(
                    label=f"{h:02d}:00",
                    demand=avg_h,
                    baseline=base_h,
                )
            )

        total_pred = sum(r.predicted_demand for r in route_insights)
        high_risk_count = sum(1 for r in route_insights if r.risk in ("High", "Critical"))
        avg_risk = round(sum(r.overcrowding_probability for r in route_insights) / max(1, len(route_insights)), 3)
        total_rec_buses = sum(r.recommended_buses for r in route_insights)
        additional_buses = max(0, total_rec_buses - fleet_cfg.fleet_size)
        total_req_cap = total_rec_buses * v_cap

        risk_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
        for r in route_insights:
            risk_counts[r.risk] = risk_counts.get(r.risk, 0) + 1

        risk_dist = [
            RiskDistributionItem(name=k, value=v)
            for k, v in risk_counts.items()
            if k in ("Low", "Medium", "High")
        ]

        activity = [
            ActivityItem(
                title=f"{resolved_mode.value.capitalize()} peak forecast refreshed",
                detail=f"Active fleet sizing: {fleet_cfg.fleet_size} {fleet_cfg.vehicle_type_name.lower()}s with capacity {v_cap} each.",
                time="10 min ago",
            ),
            ActivityItem(
                title="Rainfall sensitivity checked",
                detail="Interchange crowding remains elevated during commute intervals.",
                time="42 min ago",
            ),
            ActivityItem(
                title=f"Mumbai {resolved_mode.value.lower()} network loaded",
                detail=f"{len(routes)} routes · {len(set(s for r in routes for s in r.stations))} stations active.",
                time="Yesterday",
            ),
        ]

        return DashboardResponse(
            mode=resolved_mode.value,
            total_predicted_demand=round(total_pred, 1),
            high_risk_routes=high_risk_count,
            average_risk=avg_risk,
            available_buses=fleet_cfg.fleet_size,
            total_required_capacity=total_req_cap,
            recommended_additional_buses=additional_buses,
            routes=route_insights,
            trend=trend,
            risk_distribution=risk_dist,
            activity=activity,
        )



# Singleton service instance for domain consumers
transport_data_service = TransportDataService()
