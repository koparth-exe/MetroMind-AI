"""Canonical transport-mode values and boundary normalization."""

from enum import Enum


class TransportMode(str, Enum):
    """Transport modes recognized by the application domain."""

    RAILWAY = "RAILWAY"
    BUS = "BUS"

    @classmethod
    def normalize(cls, value: "TransportMode | str") -> "TransportMode":
        """Convert an external mode value into its single canonical form.

        Boundary input is case-insensitive for the canonical names only. Legacy
        aliases such as ``train`` and ``rail`` are deliberately rejected.
        """

        if isinstance(value, cls):
            return value
        if not isinstance(value, str):
            raise ValueError("Transport mode must be a string.")

        normalized = value.strip().upper()
        try:
            return cls(normalized)
        except ValueError as exc:
            supported = ", ".join(mode.value for mode in cls)
            raise ValueError(
                f"Unsupported transport mode '{value}'. Supported modes: {supported}."
            ) from exc
