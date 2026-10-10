import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.recipient import RecipientStatus
from app.schemas.recipient import RecipientResponse
from app.schemas.common import PaginatedResponse
from app.repositories.job_repository import JobRepository
from app.repositories.recipient_repository import RecipientRepository
from app.core.errors import JobNotFoundError

router = APIRouter()


@router.get("/jobs/{job_id}/recipients", response_model=PaginatedResponse[RecipientResponse])
def list_job_recipients(
    job_id: str,
    status: Optional[RecipientStatus] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Lists recipients for a given job with optional status filtering and pagination."""
    job_repo = JobRepository(db)
    job = job_repo.get_by_id(job_id)
    if not job:
        raise JobNotFoundError(job_id)

    recipient_repo = RecipientRepository(db)
    offset = (page - 1) * page_size
    items, total = recipient_repo.list_by_job(
        job_id=job_id,
        status=status,
        search=search,
        offset=offset,
        limit=page_size
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
