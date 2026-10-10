import enum
from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Integer, DateTime, Text, Enum, Index, BigInteger
)
from sqlalchemy.orm import relationship
from app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    VALIDATING = "validating"
    PROCESSING = "processing"
    COMPLETED = "completed"
    COMPLETED_WITH_ERRORS = "completed_with_errors"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ArchiveStatus(str, enum.Enum):
    NONE = "none"
    PENDING = "pending"
    READY = "ready"
    FAILED = "failed"


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    idempotency_key = Column(String(128), unique=True, nullable=True, index=True)
    
    event_name = Column(String(255), nullable=True)
    course_name = Column(String(255), nullable=False)
    issuer = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    issue_date = Column(String(32), nullable=False)
    
    status = Column(
        Enum(JobStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=JobStatus.QUEUED,
        nullable=False,
        index=True
    )
    
    total_count = Column(Integer, default=0, nullable=False)
    valid_count = Column(Integer, default=0, nullable=False)
    invalid_count = Column(Integer, default=0, nullable=False)
    pending_count = Column(Integer, default=0, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)

    error_summary = Column(Text, nullable=True)
    
    archive_status = Column(
        Enum(ArchiveStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=ArchiveStatus.NONE,
        nullable=False
    )
    archive_storage_key = Column(String(512), nullable=True)
    archive_size_bytes = Column(BigInteger, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    recipients = relationship("RecipientCertificate", back_populates="job", cascade="all, delete-orphan", lazy="dynamic")

    __table_args__ = (
        Index("ix_jobs_status_created_at", "status", "created_at"),
    )
