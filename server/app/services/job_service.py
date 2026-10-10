import threading
import logging
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.job import GenerationJob, JobStatus, ArchiveStatus
from app.models.recipient import RecipientCertificate, RecipientStatus
from app.schemas.job import JobCreate, JobResponse, JobProgressResponse
from app.schemas.recipient import RecipientInput
from app.repositories.job_repository import JobRepository
from app.repositories.recipient_repository import RecipientRepository
from app.services.validation_service import ValidationService
from app.services.certificate_service import CertificateService
from app.tasks.generation_tasks import process_job_task, prepare_archive_task, run_job_processing
from app.core.errors import JobNotFoundError, InvalidJobStateError

logger = logging.getLogger(__name__)


class JobService:
    AUTO_DISPATCH_BACKGROUND: bool = True

    @classmethod
    def _dispatch_task(cls, job_id: str):
        """
        Dispatches Celery task if broker is reachable;
        falls back to background worker thread to ensure seamless local operation.
        """
        if not cls.AUTO_DISPATCH_BACKGROUND:
            return

        try:
            process_job_task.delay(job_id)
            logger.info(f"Dispatched Celery task for job {job_id}")
        except Exception as e:
            logger.warning(f"Could not reach Celery broker ({e}). Dispatching in background thread.")
            worker_thread = threading.Thread(target=run_job_processing, args=(job_id,), daemon=True)
            worker_thread.start()

    @staticmethod
    def _dispatch_archive_task(job_id: str):
        try:
            prepare_archive_task.delay(job_id)
            logger.info(f"Dispatched Celery archive task for job {job_id}")
        except Exception as e:
            logger.warning(f"Could not reach Celery broker ({e}). Dispatching archive in background thread.")
            from app.db.session import SessionLocal
            from app.services.archive_service import ArchiveService
            def run_archive():
                with SessionLocal() as db:
                    ArchiveService.create_job_zip_archive(db, job_id)
            worker_thread = threading.Thread(target=run_archive, daemon=True)
            worker_thread.start()

    @classmethod
    def create_job(cls, db: Session, job_in: JobCreate) -> GenerationJob:
        job_repo = JobRepository(db)
        recipient_repo = RecipientRepository(db)

        # Idempotency check
        if job_in.idempotency_key:
            existing = job_repo.get_by_idempotency_key(job_in.idempotency_key)
            if existing:
                logger.info(f"Returning existing job {existing.id} for idempotency key {job_in.idempotency_key}")
                return existing

        # Validate recipients
        validation_result = ValidationService.validate_recipients(job_in.recipients)

        job = GenerationJob(
            idempotency_key=job_in.idempotency_key,
            event_name=job_in.event_name,
            course_name=job_in.course_name,
            issuer=job_in.issuer,
            organization=job_in.organization,
            issue_date=job_in.issue_date,
            status=JobStatus.QUEUED,
            total_count=validation_result.total_count,
            valid_count=len(validation_result.valid_items),
            invalid_count=len(validation_result.invalid_items),
            pending_count=len(validation_result.valid_items),
            success_count=0,
            failed_count=0
        )
        job = job_repo.create(job)

        recipients_to_insert: List[RecipientCertificate] = []

        # 1. Valid recipients
        for item in validation_result.valid_items:
            cert_id = CertificateService.generate_certificate_id()
            recipients_to_insert.append(
                RecipientCertificate(
                    job_id=job.id,
                    certificate_id=cert_id,
                    recipient_name=item["recipient_name"],
                    recipient_email=item.get("recipient_email"),
                    status=RecipientStatus.PENDING
                )
            )

        # 2. Invalid recipients
        for item in validation_result.invalid_items:
            cert_id = CertificateService.generate_certificate_id()
            recipients_to_insert.append(
                RecipientCertificate(
                    job_id=job.id,
                    certificate_id=cert_id,
                    recipient_name=item.get("recipient_name") or "Unknown",
                    recipient_email=item.get("recipient_email"),
                    status=RecipientStatus.INVALID,
                    error_message=item.get("reason", "Validation error")
                )
            )

        if recipients_to_insert:
            recipient_repo.bulk_insert(recipients_to_insert)

        # Dispatch async processing if valid recipients exist
        if len(validation_result.valid_items) > 0:
            cls._dispatch_task(job.id)
        else:
            job_repo.update_status(job.id, JobStatus.FAILED, error_summary="No valid recipients found in request.")

        return job

    @classmethod
    def create_job_from_csv(
        cls,
        db: Session,
        csv_bytes: bytes,
        course_name: str,
        issuer: str,
        organization: str,
        issue_date: str,
        event_name: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> GenerationJob:
        recipients, parse_errors = ValidationService.parse_csv(csv_bytes)
        job_in = JobCreate(
            event_name=event_name,
            course_name=course_name,
            issuer=issuer,
            organization=organization,
            issue_date=issue_date,
            recipients=recipients,
            idempotency_key=idempotency_key
        )
        return cls.create_job(db, job_in)

    @classmethod
    def get_progress(cls, db: Session, job_id: str) -> JobProgressResponse:
        job_repo = JobRepository(db)
        job = job_repo.get_by_id(job_id)
        if not job:
            raise JobNotFoundError(job_id)

        processed = job.success_count + job.failed_count + job.invalid_count
        progress_percentage = (processed / job.total_count * 100.0) if job.total_count > 0 else 100.0
        is_completed = job.status in [
            JobStatus.COMPLETED,
            JobStatus.COMPLETED_WITH_ERRORS,
            JobStatus.FAILED,
            JobStatus.CANCELLED
        ]

        return JobProgressResponse(
            job_id=job.id,
            status=job.status,
            total_count=job.total_count,
            valid_count=job.valid_count,
            invalid_count=job.invalid_count,
            pending_count=job.pending_count,
            success_count=job.success_count,
            failed_count=job.failed_count,
            progress_percentage=round(min(progress_percentage, 100.0), 2),
            is_completed=is_completed,
            archive_status=job.archive_status,
            error_summary=job.error_summary,
            created_at=job.created_at,
            updated_at=job.updated_at,
            completed_at=job.completed_at
        )

    @classmethod
    def cancel_job(cls, db: Session, job_id: str) -> GenerationJob:
        job_repo = JobRepository(db)
        job = job_repo.get_by_id(job_id)
        if not job:
            raise JobNotFoundError(job_id)

        if job.status in [JobStatus.COMPLETED, JobStatus.COMPLETED_WITH_ERRORS, JobStatus.FAILED]:
            raise InvalidJobStateError(job.status.value, "cancel")

        job_repo.update_status(job_id, JobStatus.CANCELLED, error_summary="Job cancelled by user.")
        return job

    @classmethod
    def retry_failed(cls, db: Session, job_id: str) -> GenerationJob:
        job_repo = JobRepository(db)
        recipient_repo = RecipientRepository(db)
        job = job_repo.get_by_id(job_id)
        if not job:
            raise JobNotFoundError(job_id)

        if job.status not in [JobStatus.FAILED, JobStatus.COMPLETED_WITH_ERRORS]:
            raise InvalidJobStateError(job.status.value, "retry")

        reset_count = recipient_repo.reset_failed_for_retry(job_id)
        if reset_count > 0:
            job_repo.update_status(job_id, JobStatus.QUEUED)
            job_repo.recalculate_counts(job_id)
            cls._dispatch_task(job_id)

        return job

    @classmethod
    def request_archive(cls, db: Session, job_id: str):
        job_repo = JobRepository(db)
        job = job_repo.get_by_id(job_id)
        if not job:
            raise JobNotFoundError(job_id)

        if job.success_count == 0:
            raise InvalidJobStateError("No successful certificates to archive", "archive")

        job_repo.update_archive_status(job_id, ArchiveStatus.PENDING)
        cls._dispatch_archive_task(job_id)
