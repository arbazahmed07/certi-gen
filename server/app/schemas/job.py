from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.job import JobStatus, ArchiveStatus
from app.schemas.recipient import RecipientInput, RecipientResponse


class JobCreate(BaseModel):
    event_name: Optional[str] = Field(default=None, max_length=255, description="Optional event name")
    course_name: str = Field(..., min_length=2, max_length=255, description="Name of the course/program")
    issuer: str = Field(..., min_length=2, max_length=255, description="Issuer name / signatory")
    organization: str = Field(..., min_length=2, max_length=255, description="Issuing organization")
    issue_date: str = Field(..., min_length=4, max_length=32, description="Date on certificate e.g. 'October 15, 2026'")
    recipients: List[RecipientInput] = Field(default_factory=list, description="List of recipient entries")
    idempotency_key: Optional[str] = Field(default=None, max_length=128, description="Unique client key to prevent duplicate job creation")

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
    error_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_name: Optional[str] = None
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
    error_summary: Optional[str] = None
    archive_status: ArchiveStatus
    archive_storage_key: Optional[str] = None
    archive_size_bytes: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


class JobDetailResponse(JobResponse):
    recipients_sample: List[RecipientResponse] = Field(default_factory=list)

