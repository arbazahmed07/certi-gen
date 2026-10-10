from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.recipient import RecipientStatus


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    certificate_id: str
    recipient_name: str
    recipient_email: Optional[str] = None
    course_name: str
    issuer: str
    organization: str
    issue_date: str
    event_name: Optional[str] = None
    status: RecipientStatus
    storage_key: Optional[str] = None
    file_size_bytes: Optional[int] = None
    generated_at: Optional[datetime] = None
    download_url: Optional[str] = None


class CertificateVerifyResponse(BaseModel):
    valid: bool
    certificate_id: str
    recipient_name: Optional[str] = None
    course_name: Optional[str] = None
    issuer: Optional[str] = None
    organization: Optional[str] = None
    issue_date: Optional[str] = None
    event_name: Optional[str] = None
    generated_at: Optional[datetime] = None
