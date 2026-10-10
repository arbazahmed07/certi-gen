from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.recipient import RecipientStatus


class RecipientInput(BaseModel):
    recipient_name: Optional[str] = Field(default="", max_length=255, description="Full name of certificate recipient")
    recipient_email: Optional[str] = Field(default=None, max_length=255, description="Email of recipient")


class RecipientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    certificate_id: str
    recipient_name: str
    recipient_email: Optional[str] = None
    status: RecipientStatus
    error_message: Optional[str] = None
    storage_key: Optional[str] = None
    file_size_bytes: Optional[int] = None
    retry_count: int
    generated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
