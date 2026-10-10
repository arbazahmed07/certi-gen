import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


def utcnow():
    return datetime.now(UTC)


class RecipientStatus(str, enum.Enum):
    PENDING = "pending"
    VALIDATING = "validating"
    INVALID = "invalid"
    GENERATING = "generating"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RecipientCertificate(Base):
    __tablename__ = "recipient_certificates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("generation_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Public certificate verification ID, e.g. CERT-YYYY-ABC12345
    certificate_id = Column(String(64), unique=True, nullable=False, index=True)
    
    recipient_name = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=True)
    
    status = Column(
        Enum(RecipientStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=RecipientStatus.PENDING,
        nullable=False,
        index=True
    )
    
    error_message = Column(Text, nullable=True)
    storage_key = Column(String(512), nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)
    
    retry_count = Column(Integer, default=0, nullable=False)
    
    generated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    job = relationship("GenerationJob", back_populates="recipients")

    __table_args__ = (
        Index("ix_recipients_job_status", "job_id", "status"),
        Index("ix_recipients_email", "recipient_email"),
    )
