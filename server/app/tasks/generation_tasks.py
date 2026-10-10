import logging
from typing import Optional
from app.tasks.celery_app import celery_app
from app.db.session import SessionLocal
from app.repositories.job_repository import JobRepository
from app.repositories.recipient_repository import RecipientRepository
from app.models.job import JobStatus, ArchiveStatus
from app.models.recipient import RecipientStatus
from app.services.certificate_service import CertificateService
from app.services.archive_service import ArchiveService

logger = logging.getLogger(__name__)


def run_job_processing(job_id: str):
    """
    Core idempotent batch execution logic for processing a generation job.
    Processes in bounded batches without keeping DB transactions open during PDF generation.
    """
    logger.info(f"Starting execution for job {job_id}")
    
    with SessionLocal() as db:
        job_repo = JobRepository(db)
        job = job_repo.get_by_id(job_id)
        if not job:
            logger.error(f"Job {job_id} not found.")
            return

        if job.status in [JobStatus.CANCELLED, JobStatus.COMPLETED]:
            logger.info(f"Job {job_id} is already in state {job.status}. Skipping.")
            return

        job_repo.update_status(job_id, JobStatus.PROCESSING)
        course_name = job.course_name
        issuer = job.issuer
        organization = job.organization
        issue_date = job.issue_date
        event_name = job.event_name

    # Process in bounded batches
    batch_size = 50
    has_more = True

    while has_more:
        # Check if cancelled before starting next batch
        with SessionLocal() as db:
            job_repo = JobRepository(db)
            job = job_repo.get_by_id(job_id)
            if job and job.status == JobStatus.CANCELLED:
                logger.info(f"Job {job_id} was cancelled by user.")
                return

            recipient_repo = RecipientRepository(db)
            batch = recipient_repo.get_pending_batch(job_id, limit=batch_size)
            if not batch:
                has_more = False
                break

            # Extract recipient metadata to process outside DB transaction
            recipient_batch_data = [
                {
                    "id": rec.id,
                    "cert_id": rec.certificate_id,
                    "name": rec.recipient_name,
                    "email": rec.recipient_email
                }
                for rec in batch
            ]

        # Generate PDFs outside active DB transaction
        batch_results = []
        for item in recipient_batch_data:
            try:
                storage_key, file_size = CertificateService.render_and_store_pdf(
                    certificate_id=item["cert_id"],
                    recipient_name=item["name"],
                    course_name=course_name,
                    issuer=issuer,
                    organization=organization,
                    issue_date=issue_date,
                    event_name=event_name
                )
                batch_results.append({
                    "id": item["id"],
                    "success": True,
                    "storage_key": storage_key,
                    "file_size": file_size,
                    "error": None
                })
            except Exception as exc:
                logger.error(f"Error generating certificate for {item['cert_id']}: {exc}", exc_info=True)
                batch_results.append({
                    "id": item["id"],
                    "success": False,
                    "storage_key": None,
                    "file_size": None,
                    "error": str(exc)
                })

        # Commit batch results to DB
        with SessionLocal() as db:
            recipient_repo = RecipientRepository(db)
            for res in batch_results:
                if res["success"]:
                    recipient_repo.mark_success(res["id"], res["storage_key"], res["file_size"])
                else:
                    recipient_repo.mark_failed(res["id"], res["error"])

            job_repo = JobRepository(db)
            job_repo.recalculate_counts(job_id)

    # Finalize job status
    with SessionLocal() as db:
        job_repo = JobRepository(db)
        job = job_repo.recalculate_counts(job_id)
        if not job or job.status == JobStatus.CANCELLED:
            return

        if job.failed_count > 0 and job.success_count > 0:
            final_status = JobStatus.COMPLETED_WITH_ERRORS
            err_summary = f"Completed with {job.failed_count} errors out of {job.total_count} recipients."
        elif job.failed_count > 0 and job.success_count == 0:
            final_status = JobStatus.FAILED
            err_summary = f"All {job.failed_count} certificate generations failed."
        else:
            final_status = JobStatus.COMPLETED
            err_summary = None

        job_repo.update_status(job_id, final_status, error_summary=err_summary)
        logger.info(f"Job {job_id} finished with status {final_status}")


@celery_app.task(name="tasks.process_job", bind=True, max_retries=3, default_retry_delay=5)
def process_job_task(self, job_id: str):
    try:
        run_job_processing(job_id)
    except Exception as exc:
        logger.error(f"Celery task failed for job {job_id}: {exc}", exc_info=True)
        raise self.retry(exc=exc)


@celery_app.task(name="tasks.prepare_archive", bind=True, max_retries=2)
def prepare_archive_task(self, job_id: str):
    try:
        with SessionLocal() as db:
            ArchiveService.create_job_zip_archive(db, job_id)
    except Exception as exc:
        logger.error(f"Failed to prepare archive for job {job_id}: {exc}", exc_info=True)
        with SessionLocal() as db:
            job_repo = JobRepository(db)
            job_repo.update_archive_status(job_id, ArchiveStatus.FAILED)
        raise self.retry(exc=exc)
