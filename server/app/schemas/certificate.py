from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.recipient import RecipientStatus


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    certificate_id: str
    recipient_name: str
    recipient_email: str | None = None
    course_name: str
    issuer: str
    organization: str
    issue_date: str
    event_name: str | None = None
    status: RecipientStatus
    storage_key: str | None = None
    file_size_bytes: int | None = None
    generated_at: datetime | None = None
    download_url: str | None = None


class CertificateVerifyResponse(BaseModel):
    valid: bool
    certificate_id: str
    recipient_name: str | None = None
    course_name: str | None = None
    issuer: str | None = None
    organization: str | None = None
    issue_date: str | None = None
    event_name: str | None = None
    generated_at: datetime | None = None
