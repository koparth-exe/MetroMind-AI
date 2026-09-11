"""Registry for the transport modes supported by the application boundary."""

from collections.abc import Iterable

from app.domain.transport.enums import TransportMode


class TransportRegistry:
    """Owns the set of modes the FastAPI domain will accept.

    A caller must resolve a mode through this registry before passing it to a
    future mode-aware dataset or domain service. The registry recognizes a mode;
    it does not claim that a mode-specific dataset or calculation exists.
    """

    def __init__(self, supported_modes: Iterable[TransportMode]) -> None:
        self._supported_modes = tuple(supported_modes)
        if not self._supported_modes:
            raise ValueError("At least one transport mode must be supported.")

    def supported_modes(self) -> tuple[TransportMode, ...]:
        """Return all supported modes in stable API order."""

        return self._supported_modes

    def require_mode(self, value: TransportMode | str) -> TransportMode:
        """Normalize and validate a mode before it reaches domain services."""

        mode = TransportMode.normalize(value)
        if mode not in self._supported_modes:
            supported = ", ".join(item.value for item in self._supported_modes)
            raise ValueError(f"Unsupported transport mode '{mode.value}'. Supported modes: {supported}.")
        return mode


transport_registry = TransportRegistry(TransportMode)
