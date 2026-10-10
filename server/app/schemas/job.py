from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.job import ArchiveStatus, JobStatus
from app.schemas.recipient import RecipientInput, RecipientResponse


class JobCreate(BaseModel):
    event_name: str | None = Field(default=None, max_length=255, description="Optional event name")
    course_name: str = Field(..., min_length=2, max_length=255, description="Name of the course/program")
    issuer: str = Field(..., min_length=2, max_length=255, description="Issuer name / signatory")
    organization: str = Field(..., min_length=2, max_length=255, description="Issuing organization")
    issue_date: str = Field(..., min_length=4, max_length=32, description="Date on certificate e.g. 'October 15, 2026'")
    recipients: list[RecipientInput] = Field(default_factory=list, description="List of recipient entries")
    idempotency_key: str | None = Field(default=None, max_length=128, description="Unique client key to prevent duplicate job creation")

    @field_validator("course_name", "issuer", "organization", "issue_date")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field cannot be empty")
        return stripped


class JobProgressResponse(BaseModel):
    job_id: str
    status: JobStatus
    total_count: int
    valid_count: int
    invalid_count: int
    pending_count: int
    success_count: int
    failed_count: int
    progress_percentage: float
    is_completed: bool
    archive_status: ArchiveStatus
    error_summary: str | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_name: str | None = None
    course_name: str
    issuer: str
    organization: str
    issue_date: str
    status: JobStatus
    total_count: int
    valid_count: int
    invalid_count: int
    pending_count: int
    success_count: int
    failed_count: int
    progress_percentage: float
    error_summary: str | None = None
    archive_status: ArchiveStatus
    archive_storage_key: str | None = None
    archive_size_bytes: int | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class JobDetailResponse(JobResponse):
    recipients_sample: list[RecipientResponse] = Field(default_factory=list)

