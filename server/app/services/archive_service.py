import io
import zipfile
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.repositories.job_repository import JobRepository
from app.repositories.recipient_repository import RecipientRepository
from app.models.job import ArchiveStatus
from app.storage import get_storage
import logging

logger = logging.getLogger(__name__)


class ArchiveService:
    @classmethod
    def create_job_zip_archive(cls, db: Session, job_id: str) -> Tuple[str, int]:
        job_repo = JobRepository(db)
        recipient_repo = RecipientRepository(db)
        storage = get_storage()

        job = job_repo.get_by_id(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        job_repo.update_archive_status(job_id, ArchiveStatus.PENDING)

        successful_recipients = recipient_repo.get_successful_recipients(job_id)
        if not successful_recipients:
            job_repo.update_archive_status(job_id, ArchiveStatus.FAILED)
            raise ValueError("No successful certificates available to archive.")

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
            for rec in successful_recipients:
                if not rec.storage_key:
                    continue
                pdf_data = storage.get_bytes(rec.storage_key)
                if not pdf_data:
                    continue

                safe_name = "".join(c for c in rec.recipient_name if c.isalnum() or c in (" ", "-", "_")).strip()
                filename = f"{rec.certificate_id}_{safe_name}.pdf"
                zip_file.writestr(filename, pdf_data)

        zip_bytes = zip_buffer.getvalue()
        storage_key = f"archives/job_{job_id}_certificates.zip"
        storage.save_bytes(storage_key, zip_bytes, content_type="application/zip")

        archive_size = len(zip_bytes)
        job_repo.update_archive_status(job_id, ArchiveStatus.READY, storage_key, archive_size)

        return storage_key, archive_size
