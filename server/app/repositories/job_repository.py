from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, select, func
from app.models.job import GenerationJob, JobStatus, ArchiveStatus, utcnow


class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, job_id: str) -> Optional[GenerationJob]:
        return self.db.query(GenerationJob).filter(GenerationJob.id == job_id).first()

    def get_by_idempotency_key(self, idempotency_key: str) -> Optional[GenerationJob]:
        if not idempotency_key:
            return None
        return self.db.query(GenerationJob).filter(GenerationJob.idempotency_key == idempotency_key).first()

    def create(self, job: GenerationJob) -> GenerationJob:
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def list_jobs(
        self,
        status: Optional[JobStatus] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 20
    ) -> Tuple[List[GenerationJob], int]:
        query = self.db.query(GenerationJob)

        if status:
            query = query.filter(GenerationJob.status == status)

        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (GenerationJob.course_name.ilike(search_filter)) |
                (GenerationJob.organization.ilike(search_filter)) |
                (GenerationJob.issuer.ilike(search_filter)) |
                (GenerationJob.id.ilike(search_filter))
            )

        total = query.count()
        jobs = query.order_by(desc(GenerationJob.created_at)).offset(offset).limit(limit).all()
        return jobs, total

    def update_status(self, job_id: str, status: JobStatus, error_summary: Optional[str] = None) -> Optional[GenerationJob]:
        job = self.get_by_id(job_id)
        if not job:
            return None

        job.status = status
        if error_summary is not None:
            job.error_summary = error_summary

        if status in [JobStatus.COMPLETED, JobStatus.COMPLETED_WITH_ERRORS, JobStatus.FAILED, JobStatus.CANCELLED]:
            job.completed_at = utcnow()

        self.db.commit()
        self.db.refresh(job)
        return job

    def update_archive_status(
        self,
        job_id: str,
        archive_status: ArchiveStatus,
        storage_key: Optional[str] = None,
        size_bytes: Optional[int] = None
    ) -> Optional[GenerationJob]:
        job = self.get_by_id(job_id)
        if not job:
            return None

        job.archive_status = archive_status
        if storage_key is not None:
            job.archive_storage_key = storage_key
        if size_bytes is not None:
            job.archive_size_bytes = size_bytes

        self.db.commit()
        self.db.refresh(job)
        return job

    def recalculate_counts(self, job_id: str) -> Optional[GenerationJob]:
        job = self.get_by_id(job_id)
        if not job:
            return None

        # Aggregate counts from recipient_certificates table
        from app.models.recipient import RecipientCertificate, RecipientStatus
        
        counts = dict(
            self.db.query(RecipientCertificate.status, func.count(RecipientCertificate.id))
            .filter(RecipientCertificate.job_id == job_id)
            .group_by(RecipientCertificate.status)
            .all()
        )

        job.total_count = sum(counts.values())
        job.success_count = counts.get(RecipientStatus.SUCCESS, 0)
        job.failed_count = counts.get(RecipientStatus.FAILED, 0)
        job.invalid_count = counts.get(RecipientStatus.INVALID, 0)
        job.pending_count = (
            counts.get(RecipientStatus.PENDING, 0) +
            counts.get(RecipientStatus.VALIDATING, 0) +
            counts.get(RecipientStatus.GENERATING, 0)
        )
        job.valid_count = job.total_count - job.invalid_count

        self.db.commit()
        self.db.refresh(job)
        return job
