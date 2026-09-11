"""Application logging setup.

Does not log API keys, authorization headers, .env contents, or other secrets.
"""

import logging
import sys

_REDACT_MARKERS = (
    "api_key",
    "apikey",
    "authorization",
    "secret",
    "password",
    "token",
    ".env",
)


class _SecretRedactingFilter(logging.Filter):
    """Drop log records that appear to contain secrets."""

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage().lower()
        return not any(marker in message for marker in _REDACT_MARKERS)


def configure_logging(level: str = "INFO") -> None:
    """Configure process-wide logging once at application startup."""
    root = logging.getLogger()
    if root.handlers:
        root.setLevel(level)
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s %(levelname)s [%(name)s] %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
    )
    handler.addFilter(_SecretRedactingFilter())

    root.setLevel(level)
    root.addHandler(handler)

    logging.getLogger("uvicorn.access").addFilter(_SecretRedactingFilter())
