"""Fleet capacity and vehicle allocation configuration.

Values represent demonstration configurations derived from the legacy reference
system and must not be treated as real-world Mumbai transport statistics.
"""

from pydantic import BaseModel, Field

from app.domain.transport.enums import TransportMode
from app.domain.transport.registry import transport_registry


class FleetConfig(BaseModel):
    """Transport-neutral fleet and vehicle capacity configuration."""

    mode: TransportMode = Field(description="Associated canonical transport mode.")
    vehicle_capacity: int = Field(
        gt=0,
        description="Nominal passenger capacity per transit vehicle (e.g. per train or bus).",
    )
    fleet_size: int = Field(
        gt=0,
        description="Total fleet size / number of active vehicles allocated for demo planning.",
    )
    vehicle_type_name: str = Field(
        description="Descriptive vehicle nomenclature (e.g. 'Train', 'Bus')."
    )

    @property
    def total_fleet_capacity(self) -> int:
        """Total nominal capacity across the entire vehicle fleet."""
        return self.vehicle_capacity * self.fleet_size


# Legacy demonstration defaults:
# Railway: 4 trains with 3,000 capacity each.
# Bus: 4 buses with 70 capacity each.
_DEMO_FLEET_CONFIGS: dict[TransportMode, FleetConfig] = {
    TransportMode.RAILWAY: FleetConfig(
        mode=TransportMode.RAILWAY,
        vehicle_capacity=3000,
        fleet_size=4,
        vehicle_type_name="Train",
    ),
    TransportMode.BUS: FleetConfig(
        mode=TransportMode.BUS,
        vehicle_capacity=70,
        fleet_size=4,
        vehicle_type_name="Bus",
    ),
}


def get_fleet_config(mode: TransportMode | str) -> FleetConfig:
    """Retrieve demo fleet configuration for a validated transport mode.

    Raises ValueError if the mode is unsupported or invalid.
    """
    resolved_mode = transport_registry.require_mode(mode)
    return _DEMO_FLEET_CONFIGS[resolved_mode]


def capacity_for(mode: TransportMode | str) -> int:
    """Return nominal single-vehicle passenger capacity for the specified mode."""
    return get_fleet_config(mode).vehicle_capacity


def fleet_for(mode: TransportMode | str) -> int:
    """Return total active vehicle count for the specified mode."""
    return get_fleet_config(mode).fleet_size
