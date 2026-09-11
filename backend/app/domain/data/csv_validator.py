"""Reusable CSV data parsing and domain validation for passenger transit records.

Provides strict row-level error reporting, distinguishing missing fields,
invalid timestamps, out-of-bounds or non-numeric values, and mode mismatches.
"""

import csv
from datetime import datetime, timezone
import io
import re

from app.domain.data.models import CsvValidationResult, DemandRecord, RowValidationError
from app.domain.transport.enums import TransportMode
from app.domain.transport.registry import transport_registry
from app.domain.transport.routes import get_route_by_id


# Recognized column name aliases for CSV mapping
_COLUMN_ALIASES = {
    "route_id": "route_id",
    "routeid": "route_id",
    "route": "route_id",
    "passenger_count": "passenger_count",
    "passengercount": "passenger_count",
    "passengers": "passenger_count",
    "demand": "passenger_count",
    "timestamp": "timestamp",
    "date": "timestamp",
    "time": "timestamp",
    "station_id": "station_id",
    "stationid": "station_id",
    "station": "station_id",
    "stop": "station_id",
    "mode": "mode",
    "transport_mode": "mode",
    "temperature": "temperature",
    "rainfall": "rainfall",
    "day_of_week": "day_of_week",
    "is_weekend": "is_weekend",
    "is_holiday": "is_holiday",
    "special_event": "special_event",
}


def _normalize_header(header_name: str) -> str:
    """Strip whitespace and punctuation to match canonical column keys."""
    cleaned = re.sub(r"[^\w]+", "_", header_name.strip().lower()).strip("_")
    return _COLUMN_ALIASES.get(cleaned, cleaned)


def _parse_timestamp(val: str) -> datetime | None:
    """Parse ISO 8601 or common transit datetime strings into UTC datetime."""
    val = val.strip()
    if not val:
        return None
    # Replace trailing 'Z' with '+00:00' for standard ISO compatibility in Python <3.11
    if val.endswith("Z") or val.endswith("z"):
        val = val[:-1] + "+00:00"

    # Attempt fromisoformat first
    try:
        dt = datetime.fromisoformat(val)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        pass

    # Common transit formats
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(val, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _parse_bool(val: str) -> bool:
    """Convert boolean transit string values safely."""
    return val.strip().lower() in ("true", "1", "yes", "t", "y")


class CsvDataValidator:
    """Validates transit CSV content against domain rules and schema invariants."""

    REQUIRED_COLUMNS = {"route_id", "passenger_count"}

    def __init__(self, target_mode: TransportMode | str | None = None) -> None:
        self.target_mode: TransportMode | None = (
            transport_registry.require_mode(target_mode) if target_mode else None
        )

    def validate_csv(self, csv_text: str) -> CsvValidationResult:
        """Parse raw CSV text and return validated records alongside detailed errors."""
        if not csv_text or not csv_text.strip():
            return CsvValidationResult(
                is_valid=False,
                total_rows=0,
                valid_count=0,
                invalid_count=0,
                missing_values_count=0,
                records=[],
                errors=[
                    RowValidationError(
                        row_index=1,
                        field="file",
                        message="CSV content is empty.",
                        raw_value=None,
                    )
                ],
            )

        reader = csv.reader(io.StringIO(csv_text))
        try:
            raw_headers = next(reader, None)
        except csv.Error as exc:
            return CsvValidationResult(
                is_valid=False,
                total_rows=0,
                valid_count=0,
                invalid_count=0,
                missing_values_count=0,
                records=[],
                errors=[
                    RowValidationError(
                        row_index=1,
                        field="file",
                        message=f"CSV parsing syntax error: {exc}",
                    )
                ],
            )

        if not raw_headers or not any(h.strip() for h in raw_headers):
            return CsvValidationResult(
                is_valid=False,
                total_rows=0,
                valid_count=0,
                invalid_count=0,
                missing_values_count=0,
                records=[],
                errors=[
                    RowValidationError(
                        row_index=1,
                        field="header",
                        message="CSV contains no header row.",
                    )
                ],
            )

        headers = [_normalize_header(h) for h in raw_headers]
        col_indices = {name: idx for idx, name in enumerate(headers) if name}

        missing_required = self.REQUIRED_COLUMNS - set(col_indices.keys())
        if missing_required:
            missing_str = ", ".join(sorted(missing_required))
            return CsvValidationResult(
                is_valid=False,
                total_rows=0,
                valid_count=0,
                invalid_count=0,
                missing_values_count=0,
                records=[],
                errors=[
                    RowValidationError(
                        row_index=1,
                        field="header",
                        message=f"Missing required CSV column(s): {missing_str}.",
                    )
                ],
            )

        records: list[DemandRecord] = []
        errors: list[RowValidationError] = []
        missing_values_count = 0
        data_row_count = 0

        for row_idx, row in enumerate(reader, start=2):
            if not row or not any(cell.strip() for cell in row):
                continue  # skip completely empty lines

            data_row_count += 1
            row_errors: list[RowValidationError] = []

            # Check for any empty cells in defined columns
            for name, idx in col_indices.items():
                cell_val = row[idx].strip() if idx < len(row) else ""
                if cell_val == "":
                    missing_values_count += 1

            # Validate route_id
            route_idx = col_indices["route_id"]
            raw_route_id = row[route_idx].strip() if route_idx < len(row) else ""
            if not raw_route_id:
                row_errors.append(
                    RowValidationError(
                        row_index=row_idx,
                        field="route_id",
                        message="Missing required route identifier.",
                        raw_value="",
                    )
                )
            else:
                route_obj = get_route_by_id(raw_route_id)
                if self.target_mode:
                    if not route_obj:
                        row_errors.append(
                            RowValidationError(
                                row_index=row_idx,
                                field="route_id",
                                message=f"Route '{raw_route_id}' is not recognized.",
                                raw_value=raw_route_id,
                            )
                        )
                    elif route_obj.mode != self.target_mode:
                        row_errors.append(
                            RowValidationError(
                                row_index=row_idx,
                                field="route_id",
                                message=(
                                    f"Route '{raw_route_id}' belongs to {route_obj.mode.value}, "
                                    f"not target mode {self.target_mode.value}."
                                ),
                                raw_value=raw_route_id,
                            )
                        )

            # Validate passenger_count
            p_idx = col_indices["passenger_count"]
            raw_passengers = row[p_idx].strip() if p_idx < len(row) else ""
            passenger_count = -1
            if not raw_passengers:
                row_errors.append(
                    RowValidationError(
                        row_index=row_idx,
                        field="passenger_count",
                        message="Missing required passenger count.",
                        raw_value="",
                    )
                )
            else:
                try:
                    p_float = float(raw_passengers)
                    if not p_float.is_integer() or p_float < 0:
                        row_errors.append(
                            RowValidationError(
                                row_index=row_idx,
                                field="passenger_count",
                                message="Passenger count must be a non-negative integer.",
                                raw_value=raw_passengers,
                            )
                        )
                    else:
                        passenger_count = int(p_float)
                except ValueError:
                    row_errors.append(
                        RowValidationError(
                            row_index=row_idx,
                            field="passenger_count",
                            message="Passenger count must be a valid numeric value.",
                            raw_value=raw_passengers,
                        )
                    )

            # Validate timestamp (optional, defaults to now if absent, but if present must be valid)
            timestamp: datetime = datetime.now(timezone.utc)
            if "timestamp" in col_indices:
                t_idx = col_indices["timestamp"]
                raw_ts = row[t_idx].strip() if t_idx < len(row) else ""
                if raw_ts:
                    parsed_ts = _parse_timestamp(raw_ts)
                    if parsed_ts is None:
                        row_errors.append(
                            RowValidationError(
                                row_index=row_idx,
                                field="timestamp",
                                message="Invalid timestamp format; expected ISO 8601 or YYYY-MM-DD HH:MM:SS.",
                                raw_value=raw_ts,
                            )
                        )
                    else:
                        timestamp = parsed_ts

            # Validate transport mode column if present
            row_mode = self.target_mode
            if "mode" in col_indices:
                m_idx = col_indices["mode"]
                raw_mode = row[m_idx].strip() if m_idx < len(row) else ""
                if raw_mode:
                    try:
                        resolved_row_mode = transport_registry.require_mode(raw_mode)
                        if self.target_mode and resolved_row_mode != self.target_mode:
                            row_errors.append(
                                RowValidationError(
                                    row_index=row_idx,
                                    field="mode",
                                    message=(
                                        f"Row transport mode '{raw_mode}' conflicts with "
                                        f"target mode '{self.target_mode.value}'."
                                    ),
                                    raw_value=raw_mode,
                                )
                            )
                        else:
                            row_mode = resolved_row_mode
                    except ValueError as exc:
                        row_errors.append(
                            RowValidationError(
                                row_index=row_idx,
                                field="mode",
                                message=str(exc),
                                raw_value=raw_mode,
                            )
                        )

            # Optional station_id
            station_id = f"{raw_route_id}-station"
            if "station_id" in col_indices:
                s_idx = col_indices["station_id"]
                raw_station = row[s_idx].strip() if s_idx < len(row) else ""
                if raw_station:
                    station_id = raw_station

            # Optional environmental and calendar features
            day_of_week = (timestamp.weekday() + 1) % 7
            if "day_of_week" in col_indices:
                d_idx = col_indices["day_of_week"]
                raw_dow = row[d_idx].strip() if d_idx < len(row) else ""
                if raw_dow:
                    try:
                        parsed_dow = int(raw_dow)
                        if 0 <= parsed_dow <= 6:
                            day_of_week = parsed_dow
                    except ValueError:
                        pass

            is_weekend = day_of_week in (0, 6)
            if "is_weekend" in col_indices:
                w_idx = col_indices["is_weekend"]
                raw_w = row[w_idx].strip() if w_idx < len(row) else ""
                if raw_w:
                    is_weekend = _parse_bool(raw_w)

            is_holiday = False
            if "is_holiday" in col_indices:
                h_idx = col_indices["is_holiday"]
                raw_h = row[h_idx].strip() if h_idx < len(row) else ""
                if raw_h:
                    is_holiday = _parse_bool(raw_h)

            temperature = 28.0
            if "temperature" in col_indices:
                temp_idx = col_indices["temperature"]
                raw_temp = row[temp_idx].strip() if temp_idx < len(row) else ""
                if raw_temp:
                    try:
                        temperature = float(raw_temp)
                    except ValueError:
                        row_errors.append(
                            RowValidationError(
                                row_index=row_idx,
                                field="temperature",
                                message="Temperature must be a valid float.",
                                raw_value=raw_temp,
                            )
                        )

            rainfall = 0.0
            if "rainfall" in col_indices:
                rain_idx = col_indices["rainfall"]
                raw_rain = row[rain_idx].strip() if rain_idx < len(row) else ""
                if raw_rain:
                    try:
                        r_val = float(raw_rain)
                        if r_val < 0:
                            row_errors.append(
                                RowValidationError(
                                    row_index=row_idx,
                                    field="rainfall",
                                    message="Rainfall cannot be negative.",
                                    raw_value=raw_rain,
                                )
                            )
                        else:
                            rainfall = r_val
                    except ValueError:
                        row_errors.append(
                            RowValidationError(
                                row_index=row_idx,
                                field="rainfall",
                                message="Rainfall must be a valid float.",
                                raw_value=raw_rain,
                            )
                        )

            special_event = False
            if "special_event" in col_indices:
                se_idx = col_indices["special_event"]
                raw_se = row[se_idx].strip() if se_idx < len(row) else ""
                if raw_se:
                    special_event = _parse_bool(raw_se)

            # If mode could not be inferred from target_mode, column, or route_id
            if row_mode is None:
                route_obj = get_route_by_id(raw_route_id)
                if route_obj:
                    row_mode = route_obj.mode
                else:
                    row_errors.append(
                        RowValidationError(
                            row_index=row_idx,
                            field="mode",
                            message="Cannot resolve transport mode for this record.",
                            raw_value=None,
                        )
                    )

            if row_errors:
                errors.extend(row_errors)
            else:
                assert row_mode is not None
                records.append(
                    DemandRecord(
                        timestamp=timestamp,
                        route_id=raw_route_id.upper(),
                        station_id=station_id,
                        passenger_count=passenger_count,
                        day_of_week=day_of_week,
                        is_weekend=is_weekend,
                        is_holiday=is_holiday,
                        temperature=temperature,
                        rainfall=rainfall,
                        special_event=special_event,
                        mode=row_mode,
                    )
                )

        invalid_count = len({e.row_index for e in errors})
        is_valid = data_row_count > 0 and invalid_count == 0

        return CsvValidationResult(
            is_valid=is_valid,
            total_rows=data_row_count,
            valid_count=len(records),
            invalid_count=invalid_count,
            missing_values_count=missing_values_count,
            records=records,
            errors=errors,
        )
