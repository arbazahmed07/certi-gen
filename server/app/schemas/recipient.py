from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.recipient import RecipientStatus


class RecipientInput(BaseModel):
    recipient_name: str | None = Field(default="", max_length=255, description="Full name of certificate recipient")
    recipient_email: str | None = Field(default=None, max_length=255, description="Email of recipient")


class RecipientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    certificate_id: str
    recipient_name: str
    recipient_email: str | None = None
    status: RecipientStatus
    error_message: str | None = None
    storage_key: str | None = None
    file_size_bytes: int | None = None
    retry_count: int
    generated_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
