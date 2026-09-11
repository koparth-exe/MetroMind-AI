"""Deterministic synthetic demo data generation for Railway and Bus transit networks.

Preserves the domain temporal structure, diurnal commute profiles, and environmental
factors of the legacy reference implementation while ensuring strict mode isolation
and realistic capacity-relative bounds.
"""

from datetime import datetime, timezone, timedelta
import math

from app.domain.data.models import DemandRecord
from app.domain.transport.enums import TransportMode
from app.domain.transport.registry import transport_registry
from app.domain.transport.routes import get_routes_for_mode


# Baseline nominal passenger demand per route under normal conditions.
BASE_DEMAND_BY_MODE: dict[TransportMode, dict[str, int]] = {
    TransportMode.RAILWAY: {
        "R1": 2340,
        "R2": 2280,
        "R3": 1980,
        "R4": 1680,
    },
    TransportMode.BUS: {
        "B1": 30,
        "B2": 26,
        "B3": 22,
        "B4": 27,
    },
}

# Reference epoch start for demonstration dataset (28-day window).
DEMO_START_DATE = datetime(2026, 7, 27, 0, 0, 0, tzinfo=timezone.utc)
DEMO_TOTAL_DAYS = 28


def get_commute_multiplier(hour: int, mode: TransportMode) -> float:
    """Calculate hour-of-day demand multiplier for peak vs off-peak commute patterns."""
    if mode is TransportMode.BUS:
        if 8 <= hour <= 11:
            return {8: 1.8, 9: 1.7, 10: 1.5, 11: 1.3}.get(hour, 1.3)
        if 17 <= hour <= 20:
            return {17: 1.45, 18: 1.9, 19: 1.75, 20: 1.5}.get(hour, 1.4)
        if 12 <= hour <= 16:
            return {12: 0.78, 13: 0.70, 14: 0.64, 15: 0.68, 16: 0.84}.get(hour, 0.70)
        if hour >= 23 or hour <= 4:
            return 0.18 if hour in (23, 4) else 0.08
        return 0.30 if hour in (5, 21, 22) else 0.90

    # RAILWAY commute profile
    if 8 <= hour <= 11:
        return {8: 2.5, 9: 2.35, 10: 2.05, 11: 1.8}.get(hour, 1.8)
    if 17 <= hour <= 20:
        return {17: 1.7, 18: 2.4, 19: 2.25, 20: 1.9}.get(hour, 1.7)
    if 12 <= hour <= 16:
        return {12: 0.85, 13: 0.72, 14: 0.64, 15: 0.68, 16: 0.9}.get(hour, 0.7)
    if hour >= 23 or hour <= 4:
        return 0.20 if hour in (23, 4) else 0.10
    return 0.35 if hour in (5, 21, 22) else 1.05


def generate_demo_dataset(mode: TransportMode | str) -> list[DemandRecord]:
    """Generate a reproducible, mode-isolated 28-day hourly demand dataset.

    Returns 2,688 DemandRecord instances (4 routes * 28 days * 24 hours).
    Guarantees strict mode isolation: a RAILWAY request never generates BUS records
    and vice-versa.
    """
    resolved_mode = transport_registry.require_mode(mode)
    routes = get_routes_for_mode(resolved_mode)
    base_demands = BASE_DEMAND_BY_MODE[resolved_mode]

    records: list[DemandRecord] = []

    for day in range(DEMO_TOTAL_DAYS):
        day_date = DEMO_START_DATE + timedelta(days=day)
        # Transit day-of-week index: 0=Sunday, 1=Monday, ..., 6=Saturday
        day_of_week = (day_date.weekday() + 1) % 7
        is_weekend = day_of_week in (0, 6)
        weekday_factor = 0.72 if is_weekend else 1.0
        is_holiday = day in (5, 19)

        rainfall = round(7.2 if day % 6 == 0 else (day % 5) * 0.8, 1)
        temperature = round(28.0 + math.sin(day / 4.0) * 3.0 - rainfall * 0.22, 1)

        rain_suppression = 1.0 - min(0.18, rainfall * 0.018)

        for route in routes:
            base_demand = base_demands[route.route_id]
            is_special_event = (
                day == 12
                and route.route_id == ("B2" if resolved_mode is TransportMode.BUS else "R3")
            )

            interchange_routes = (
                ("B1", "B2", "B4")
                if resolved_mode is TransportMode.BUS
                else ("R1", "R3", "R4")
            )
            interchange_boost = (
                1.0 + min(0.12, rainfall * 0.012)
                if route.route_id in interchange_routes
                else 1.0
            )

            # Route second character ASCII code (e.g. '1' -> 49, '2' -> 50)
            route_ascii_code = ord(route.route_id[1]) if len(route.route_id) > 1 else 0

            for hour in range(24):
                timestamp = day_date + timedelta(hours=hour)
                variance = 1.0 + math.sin(day * 1.73 + hour * 0.91 + route_ascii_code) * 0.05
                event_factor = 1.18 if is_special_event else 1.0

                multiplier = get_commute_multiplier(hour, resolved_mode)
                raw_count = (
                    base_demand
                    * multiplier
                    * weekday_factor
                    * rain_suppression
                    * interchange_boost
                    * variance
                    * event_factor
                )

                # Realistic lower bound: 30 for high-capacity railway trains,
                # 1 for smaller-capacity buses (avoiding the legacy bus clamping bug)
                min_demand = 30 if resolved_mode is TransportMode.RAILWAY else 1
                passenger_count = max(min_demand, int(round(raw_count)))

                station_id = route.stations[day % len(route.stations)]

                records.append(
                    DemandRecord(
                        timestamp=timestamp,
                        route_id=route.route_id,
                        station_id=station_id,
                        passenger_count=passenger_count,
                        day_of_week=day_of_week,
                        is_weekend=is_weekend,
                        is_holiday=is_holiday,
                        temperature=temperature,
                        rainfall=rainfall,
                        special_event=is_special_event,
                        mode=resolved_mode,
                    )
                )

    return records
