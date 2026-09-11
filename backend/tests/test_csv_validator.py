"""Tests for CSV parsing, domain validation rules, and error tracking."""

from app.domain.data.csv_validator import CsvDataValidator
from app.domain.transport.enums import TransportMode


def test_valid_csv_passes_validation() -> None:
    csv_content = """route_id,passenger_count,timestamp,station_id,mode
R1,1200,2026-07-27T08:00:00Z,CSMT,RAILWAY
R2,1450,2026-07-27T09:00:00Z,Dadar,RAILWAY
"""
    validator = CsvDataValidator(target_mode=TransportMode.RAILWAY)
    result = validator.validate_csv(csv_content)

    assert result.is_valid is True
    assert result.total_rows == 2
    assert result.valid_count == 2
    assert result.invalid_count == 0
    assert len(result.records) == 2
    assert result.records[0].route_id == "R1"
    assert result.records[0].passenger_count == 1200
    assert result.records[0].mode is TransportMode.RAILWAY


def test_missing_required_headers_rejected() -> None:
    csv_without_passengers = """route_id,timestamp,station_id
R1,2026-07-27T08:00:00Z,CSMT
"""
    validator = CsvDataValidator()
    result = validator.validate_csv(csv_without_passengers)

    assert result.is_valid is False
    assert result.valid_count == 0
    assert any("passenger_count" in err.message for err in result.errors)


def test_missing_required_row_field_rejected() -> None:
    csv_missing_route = """route_id,passenger_count
,1500
R1,
"""
    validator = CsvDataValidator(target_mode=TransportMode.RAILWAY)
    result = validator.validate_csv(csv_missing_route)

    assert result.is_valid is False
    assert result.valid_count == 0
    assert result.invalid_count == 2
    fields_with_errors = {err.field for err in result.errors}
    assert "route_id" in fields_with_errors
    assert "passenger_count" in fields_with_errors


def test_invalid_numeric_values_rejected() -> None:
    csv_invalid_numbers = """route_id,passenger_count
R1,-50
R2,not_a_number
R3,12.5
"""
    validator = CsvDataValidator(target_mode=TransportMode.RAILWAY)
    result = validator.validate_csv(csv_invalid_numbers)

    assert result.is_valid is False
    assert result.valid_count == 0
    assert result.invalid_count == 3
    for err in result.errors:
        assert err.field == "passenger_count"


def test_invalid_timestamp_rejected() -> None:
    csv_bad_ts = """route_id,passenger_count,timestamp
R1,500,this-is-not-a-timestamp
R2,600,2026-99-99T99:99:99Z
"""
    validator = CsvDataValidator(target_mode=TransportMode.RAILWAY)
    result = validator.validate_csv(csv_bad_ts)

    assert result.is_valid is False
    assert result.valid_count == 0
    assert result.invalid_count == 2
    assert all(err.field == "timestamp" for err in result.errors)


def test_mode_mismatch_and_illegal_modes_rejected() -> None:
    # Target mode is RAILWAY, but CSV attempts to inject Bus route or illegal mode alias
    csv_mode_conflict = """route_id,passenger_count,mode
B1,50,BUS
R1,1200,train
"""
    validator = CsvDataValidator(target_mode=TransportMode.RAILWAY)
    result = validator.validate_csv(csv_mode_conflict)

    assert result.is_valid is False
    assert result.valid_count == 0
    assert result.invalid_count == 2
    error_messages = " ".join(e.message for e in result.errors)
    assert "belongs to BUS, not target mode RAILWAY" in error_messages
    assert "Unsupported transport mode 'train'" in error_messages


def test_empty_csv_rejected() -> None:
    validator = CsvDataValidator()
    result = validator.validate_csv("")
    assert result.is_valid is False
    assert result.valid_count == 0
    assert result.errors[0].field == "file"
