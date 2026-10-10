import io
import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.errors import CertificateNotFoundError
from app.db.session import get_db
from app.models.recipient import RecipientStatus
from app.repositories.recipient_repository import RecipientRepository
from app.schemas.certificate import CertificateResponse, CertificateVerifyResponse
from app.schemas.common import PaginatedResponse
from app.storage import get_storage

router = APIRouter()


@router.get("", response_model=PaginatedResponse[CertificateResponse])
def list_certificates(
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Lists all successfully issued certificates with pagination and search."""
    recipient_repo = RecipientRepository(db)
    offset = (page - 1) * page_size
    items, total = recipient_repo.list_all_certificates(
        search=search,
        offset=offset,
        limit=page_size
    )

    cert_responses = []
    for item in items:
        job = item.job
        cert_responses.append(CertificateResponse(
            id=item.id,
            job_id=item.job_id,
            certificate_id=item.certificate_id,
            recipient_name=item.recipient_name,
            recipient_email=item.recipient_email,
            course_name=job.course_name if job else "N/A",
            issuer=job.issuer if job else "N/A",
            organization=job.organization if job else "N/A",
            issue_date=job.issue_date if job else "N/A",
            event_name=job.event_name if job else None,
            status=item.status,
            storage_key=item.storage_key,
            file_size_bytes=item.file_size_bytes,
            generated_at=item.generated_at,
            download_url=f"/api/v1/certificates/{item.certificate_id}/download"
        ))

    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        items=cert_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/verify/{certificate_id}", response_model=CertificateVerifyResponse)
def verify_certificate(certificate_id: str, db: Session = Depends(get_db)):
    """Public verification endpoint to authenticate a certificate."""
    recipient_repo = RecipientRepository(db)
    rec = recipient_repo.get_by_certificate_id(certificate_id)
    if not rec or rec.status != RecipientStatus.SUCCESS:
        return CertificateVerifyResponse(
            valid=False,
            certificate_id=certificate_id
        )

    job = rec.job
    return CertificateVerifyResponse(
        valid=True,
        certificate_id=rec.certificate_id,
        recipient_name=rec.recipient_name,
        course_name=job.course_name if job else None,
        issuer=job.issuer if job else None,
        organization=job.organization if job else None,
        issue_date=job.issue_date if job else None,
        event_name=job.event_name if job else None,
        generated_at=rec.generated_at
    )


@router.get("/{certificate_id}", response_model=CertificateResponse)
def get_certificate(certificate_id: str, db: Session = Depends(get_db)):
    """Retrieves metadata for a specific certificate."""
    recipient_repo = RecipientRepository(db)
    rec = recipient_repo.get_by_certificate_id(certificate_id)
    if not rec:
        raise CertificateNotFoundError(certificate_id)

    job = rec.job
    return CertificateResponse(
        id=rec.id,
        job_id=rec.job_id,
        certificate_id=rec.certificate_id,
        recipient_name=rec.recipient_name,
        recipient_email=rec.recipient_email,
        course_name=job.course_name if job else "N/A",
        issuer=job.issuer if job else "N/A",
        organization=job.organization if job else "N/A",
        issue_date=job.issue_date if job else "N/A",
        event_name=job.event_name if job else None,
        status=rec.status,
        storage_key=rec.storage_key,
        file_size_bytes=rec.file_size_bytes,
        generated_at=rec.generated_at,
        download_url=f"/api/v1/certificates/{rec.certificate_id}/download"
    )


@router.get("/{certificate_id}/download")
def download_certificate(certificate_id: str, db: Session = Depends(get_db)):
    """Downloads the generated PDF file for a certificate."""
    recipient_repo = RecipientRepository(db)
    rec = recipient_repo.get_by_certificate_id(certificate_id)
    if not rec:
        raise CertificateNotFoundError(certificate_id)

    if rec.status != RecipientStatus.SUCCESS or not rec.storage_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Certificate '{certificate_id}' has not been successfully generated yet."
        )

    storage = get_storage()
    data = storage.get_bytes(rec.storage_key)
    if not data:
        raise HTTPException(status_code=404, detail="Certificate PDF not found in storage.")

    safe_name = "".join(c for c in rec.recipient_name if c.isalnum() or c in ("-", "_")).strip()
    filename = f"Certificate_{rec.certificate_id}_{safe_name}.pdf"

    return StreamingResponse(
        io.BytesIO(data),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/{certificate_id}/preview")
def preview_certificate(certificate_id: str, db: Session = Depends(get_db)):
    """Streams the certificate PDF inline for browser viewing."""
    recipient_repo = RecipientRepository(db)
    rec = recipient_repo.get_by_certificate_id(certificate_id)
    if not rec:
        raise CertificateNotFoundError(certificate_id)

    storage = get_storage()
    data = storage.get_bytes(rec.storage_key) if rec.storage_key else None
    if not data:
        raise HTTPException(status_code=404, detail="Certificate file not found.")

    return StreamingResponse(
        io.BytesIO(data),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={rec.certificate_id}.pdf"
        }
    )
