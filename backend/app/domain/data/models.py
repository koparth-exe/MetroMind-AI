"""Pydantic data models for passenger demand records, datasets, and validation."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.domain.transport.enums import TransportMode


class DemandRecord(BaseModel):
    """An individual passenger transit demand observation."""

    timestamp: datetime = Field(
        description="Observation timestamp in UTC (ISO 8601)."
    )
    route_id: str = Field(description="Transit route identifier (e.g. 'R1', 'B2').")
    station_id: str = Field(
        description="Station or stop identifier where observation occurred."
    )
    passenger_count: int = Field(
        ge=0, description="Observed or simulated passenger count."
    )
    day_of_week: int = Field(
        ge=0,
        le=6,
        description="Day of week index (0=Sunday to 6=Saturday as in transit calendar).",
    )
    is_weekend: bool = Field(description="True if Saturday or Sunday.")
    is_holiday: bool = Field(
        default=False, description="Whether the date is a gazetted public holiday."
    )
    temperature: float = Field(
        description="Ambient temperature in degrees Celsius."
    )
    rainfall: float = Field(
        ge=0.0, description="Precipitation level in millimeters."
    )
    special_event: bool = Field(
        default=False,
        description="True if an extraordinary event (festival, match) impacted demand.",
    )
    mode: TransportMode = Field(
        description="Canonical transport mode to which this observation belongs."
    )


class DatasetMetadata(BaseModel):
    """Metadata describing a loaded transit demand dataset."""

    dataset_name: str = Field(description="Dataset identifier or source filename.")
    mode: TransportMode = Field(description="Associated transport mode.")
    is_demo: bool = Field(
        default=False, description="Whether this dataset contains synthetic demo data."
    )
    record_count: int = Field(
        ge=0, description="Total number of valid demand records in the dataset."
    )
    created_at: datetime = Field(
        description="Timestamp when dataset was initialized or uploaded."
    )


class DataSummary(BaseModel):
    """Statistical and quality summary of an active transit dataset."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    dataset_name: str = Field(description="Dataset title or identifier.")
    mode: TransportMode = Field(description="Canonical transport mode.")
    is_demo: bool = Field(
        description="Whether this represents the default synthetic demonstration dataset."
    )
    records: int = Field(ge=0, description="Total record count.")
    routes: int = Field(ge=0, description="Number of distinct routes observed.")
    stations: int = Field(ge=0, description="Number of distinct stations observed.")
    missing_values: int = Field(
        ge=0, description="Count of empty or unpopulated optional cells."
    )
    invalid_values: int = Field(
        ge=0, description="Count of unparseable or rejected raw rows."
    )
    date_start: str = Field(
        description="Earliest observation timestamp (YYYY-MM-DD)."
    )
    date_end: str = Field(
        description="Latest observation timestamp (YYYY-MM-DD)."
    )
    average_demand: float = Field(
        ge=0.0, description="Mean passenger demand per observation."
    )
    max_demand: int = Field(
        ge=0, description="Maximum observed passenger demand in single observation."
    )
    quality: str = Field(
        description="Overall data quality assessment (e.g. 'Excellent', 'Review required')."
    )
    columns: list[str] = Field(
        description="List of canonical data fields provided by this dataset."
    )


class RowValidationError(BaseModel):
    """Detailed error reported during row-by-row data parsing."""

    row_index: int = Field(
        ge=1, description="1-based row number within the source data."
    )
    field: str = Field(description="Column or field that failed validation.")
    message: str = Field(description="Human-readable explanation of failure.")
    raw_value: str | None = Field(
        default=None, description="Raw input value that caused the failure."
    )


class CsvValidationResult(BaseModel):
    """Comprehensive outcome of parsing and validating a CSV file."""

    is_valid: bool = Field(
        description="True if file had required headers and at least one valid row."
    )
    total_rows: int = Field(
        ge=0, description="Total data rows evaluated (excluding header)."
    )
    valid_count: int = Field(ge=0, description="Number of successfully parsed records.")
    invalid_count: int = Field(
        ge=0, description="Number of rows rejected due to schema or value errors."
    )
    missing_values_count: int = Field(
        ge=0, description="Total missing or blank cell occurrences encountered."
    )
    records: list[DemandRecord] = Field(
        default_factory=list,
        description="Parsed and validated demand records ready for domain ingestion.",
    )
    errors: list[RowValidationError] = Field(
        default_factory=list,
        description="Collection of row-specific validation errors encountered.",
    )
