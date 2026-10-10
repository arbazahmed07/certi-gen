import csv
import io
import math
from typing import Optional, List
from fastapi import (
    APIRouter, Depends, status, Query, UploadFile, File, Form, HTTPException, Response
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.job import JobStatus, ArchiveStatus
from app.models.recipient import RecipientStatus
from app.schemas.job import (
    JobCreate, JobResponse, JobProgressResponse, JobDetailResponse
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.repositories.job_repository import JobRepository
from app.repositories.recipient_repository import RecipientRepository
from app.services.job_service import JobService
from app.services.archive_service import ArchiveService
from app.storage import get_storage
from app.core.errors import JobNotFoundError, InvalidJobStateError

router = APIRouter()


@router.post("", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
    """
    Submits a bulk certificate generation job via JSON.
    Returns 202 Accepted once scheduled.
    """
    job = JobService.create_job(db, job_in)
    progress = JobService.get_progress(db, job.id)
    return JobResponse(
        id=job.id,
        event_name=job.event_name,
        course_name=job.course_name,
        issuer=job.issuer,
        organization=job.organization,
        issue_date=job.issue_date,
        status=job.status,
        total_count=job.total_count,
        valid_count=job.valid_count,
        invalid_count=job.invalid_count,
        pending_count=job.pending_count,
        success_count=job.success_count,
        failed_count=job.failed_count,
        progress_percentage=progress.progress_percentage,
        error_summary=job.error_summary,
        archive_status=job.archive_status,
        archive_storage_key=job.archive_storage_key,
        archive_size_bytes=job.archive_size_bytes,
        created_at=job.created_at,
        updated_at=job.updated_at,
        completed_at=job.completed_at
    )


@router.post("/upload-csv", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_csv_job(
    course_name: str = Form(...),
    issuer: str = Form(...),
    organization: str = Form(...),
    issue_date: str = Form(...),
    event_name: Optional[str] = Form(None),
    idempotency_key: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Submits a bulk certificate generation job by uploading a CSV.
    Returns 202 Accepted once scheduled.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a .csv file."
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded CSV file is empty."
        )

    job = JobService.create_job_from_csv(
        db=db,
        csv_bytes=content,
        course_name=course_name,
        issuer=issuer,
        organization=organization,
        issue_date=issue_date,
        event_name=event_name,
        idempotency_key=idempotency_key
    )

    progress = JobService.get_progress(db, job.id)
    return JobResponse(
        id=job.id,
        event_name=job.event_name,
        course_name=job.course_name,
        issuer=job.issuer,
        organization=job.organization,
        issue_date=job.issue_date,
        status=job.status,
        total_count=job.total_count,
        valid_count=job.valid_count,
        invalid_count=job.invalid_count,
        pending_count=job.pending_count,
        success_count=job.success_count,
        failed_count=job.failed_count,
        progress_percentage=progress.progress_percentage,
        error_summary=job.error_summary,
        archive_status=job.archive_status,
        archive_storage_key=job.archive_storage_key,
        archive_size_bytes=job.archive_size_bytes,
        created_at=job.created_at,
        updated_at=job.updated_at,
        completed_at=job.completed_at
    )


@router.get("", response_model=PaginatedResponse[JobResponse])
def list_jobs(
    status: Optional[JobStatus] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Lists jobs with optional status filter, search query, and pagination."""
    job_repo = JobRepository(db)
    offset = (page - 1) * page_size
    jobs, total = job_repo.list_jobs(status=status, search=search, offset=offset, limit=page_size)

    items = []
    for j in jobs:
        processed = j.success_count + j.failed_count + j.invalid_count
        pct = (processed / j.total_count * 100.0) if j.total_count > 0 else 100.0
        items.append(JobResponse(
            id=j.id,
            event_name=j.event_name,
            course_name=j.course_name,
            issuer=j.issuer,
            organization=j.organization,
            issue_date=j.issue_date,
            status=j.status,
            total_count=j.total_count,
            valid_count=j.valid_count,
            invalid_count=j.invalid_count,
            pending_count=j.pending_count,
            success_count=j.success_count,
            failed_count=j.failed_count,
            progress_percentage=round(min(pct, 100.0), 2),
            error_summary=j.error_summary,
            archive_status=j.archive_status,
            archive_storage_key=j.archive_storage_key,
            archive_size_bytes=j.archive_size_bytes,
            created_at=j.created_at,
            updated_at=j.updated_at,
            completed_at=j.completed_at
        ))

    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job_detail(job_id: str, db: Session = Depends(get_db)):
    """Retrieves detailed job information and a sample of recipient entries."""
    job_repo = JobRepository(db)
    job = job_repo.get_by_id(job_id)
    if not job:
        raise JobNotFoundError(job_id)

    recipient_repo = RecipientRepository(db)
    sample_recipients, _ = recipient_repo.list_by_job(job_id, offset=0, limit=10)

    progress = JobService.get_progress(db, job_id)
    return JobDetailResponse(
        id=job.id,
        event_name=job.event_name,
        course_name=job.course_name,
        issuer=job.issuer,
        organization=job.organization,
        issue_date=job.issue_date,
        status=job.status,
        total_count=job.total_count,
        valid_count=job.valid_count,
        invalid_count=job.invalid_count,
        pending_count=job.pending_count,
        success_count=job.success_count,
        failed_count=job.failed_count,
        progress_percentage=progress.progress_percentage,
        error_summary=job.error_summary,
        archive_status=job.archive_status,
        archive_storage_key=job.archive_storage_key,
        archive_size_bytes=job.archive_size_bytes,
        created_at=job.created_at,
        updated_at=job.updated_at,
        completed_at=job.completed_at,
        recipients_sample=sample_recipients
    )


@router.get("/{job_id}/progress", response_model=JobProgressResponse)
def get_job_progress(job_id: str, db: Session = Depends(get_db)):
    """Returns active progress stats and status for a job."""
    return JobService.get_progress(db, job_id)


@router.post("/{job_id}/retry", response_model=MessageResponse)
def retry_job(job_id: str, db: Session = Depends(get_db)):
    """Retries failed certificate generation for a job."""
    job = JobService.retry_failed(db, job_id)
    return MessageResponse(message=f"Job {job_id} scheduled for retry.")


@router.post("/{job_id}/cancel", response_model=MessageResponse)
def cancel_job(job_id: str, db: Session = Depends(get_db)):
    """Cancels a currently queued or processing job."""
    job = JobService.cancel_job(db, job_id)
    return MessageResponse(message=f"Job {job_id} cancelled.")


@router.post("/{job_id}/archive", response_model=MessageResponse)
def prepare_archive(job_id: str, db: Session = Depends(get_db)):
    """Requests generation of a ZIP archive containing all successful certificates."""
    JobService.request_archive(db, job_id)
    return MessageResponse(message="Archive preparation initiated.")


@router.get("/{job_id}/archive/download")
def download_archive(job_id: str, db: Session = Depends(get_db)):
    """Downloads the ZIP archive for a completed job."""
    job_repo = JobRepository(db)
    job = job_repo.get_by_id(job_id)
    if not job:
        raise JobNotFoundError(job_id)

    if job.archive_status != ArchiveStatus.READY or not job.archive_storage_key:
        # Build synchronously if not yet ready
        try:
            storage_key, _ = ArchiveService.create_job_zip_archive(db, job_id)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))
    else:
        storage_key = job.archive_storage_key

    storage = get_storage()
    data = storage.get_bytes(storage_key)
    if not data:
        raise HTTPException(status_code=404, detail="Archive file not found in storage.")

    return StreamingResponse(
        io.BytesIO(data),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=job_{job_id[:8]}_certificates.zip"
        }
    )


@router.get("/{job_id}/failed/export")
def export_failed_recipients(job_id: str, db: Session = Depends(get_db)):
    """Exports failed and invalid recipients as a downloadable CSV."""
    recipient_repo = RecipientRepository(db)
    failed_items = recipient_repo.get_failed_recipients(job_id)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Certificate ID", "Recipient Name", "Recipient Email", "Status", "Error Message"])

    for item in failed_items:
        writer.writerow([
            item.certificate_id,
            item.recipient_name,
            item.recipient_email or "",
            item.status.value,
            item.error_message or ""
        ])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=job_{job_id[:8]}_failed_recipients.csv"
        }
    )
