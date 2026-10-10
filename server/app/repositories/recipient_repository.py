
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.recipient import RecipientCertificate, RecipientStatus, utcnow


class RecipientRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, recipient_id: str) -> RecipientCertificate | None:
        return self.db.query(RecipientCertificate).filter(RecipientCertificate.id == recipient_id).first()

    def get_by_certificate_id(self, certificate_id: str) -> RecipientCertificate | None:
        return self.db.query(RecipientCertificate).filter(RecipientCertificate.certificate_id == certificate_id).first()

    def bulk_insert(self, recipients: list[RecipientCertificate]) -> None:
        self.db.bulk_save_objects(recipients)
        self.db.commit()

    def list_by_job(
        self,
        job_id: str,
        status: RecipientStatus | None = None,
        search: str | None = None,
        offset: int = 0,
        limit: int = 50
    ) -> tuple[list[RecipientCertificate], int]:
        query = self.db.query(RecipientCertificate).filter(RecipientCertificate.job_id == job_id)

        if status:
            query = query.filter(RecipientCertificate.status == status)

        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (RecipientCertificate.recipient_name.ilike(search_filter)) |
                (RecipientCertificate.recipient_email.ilike(search_filter)) |
                (RecipientCertificate.certificate_id.ilike(search_filter))
            )

        total = query.count()
        items = query.order_by(RecipientCertificate.created_at).offset(offset).limit(limit).all()
        return items, total

    def list_all_certificates(
        self,
        search: str | None = None,
        offset: int = 0,
        limit: int = 50
    ) -> tuple[list[RecipientCertificate], int]:
        query = self.db.query(RecipientCertificate).filter(RecipientCertificate.status == RecipientStatus.SUCCESS)

        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (RecipientCertificate.recipient_name.ilike(search_filter)) |
                (RecipientCertificate.recipient_email.ilike(search_filter)) |
                (RecipientCertificate.certificate_id.ilike(search_filter))
            )

        total = query.count()
        items = query.order_by(desc(RecipientCertificate.generated_at)).offset(offset).limit(limit).all()
        return items, total

    def get_pending_batch(self, job_id: str, limit: int = 50) -> list[RecipientCertificate]:
        return (
            self.db.query(RecipientCertificate)
            .filter(
                RecipientCertificate.job_id == job_id,
                RecipientCertificate.status.in_([RecipientStatus.PENDING, RecipientStatus.VALIDATING])
            )
            .limit(limit)
            .all()
        )

    def mark_success(self, recipient_id: str, storage_key: str, file_size_bytes: int) -> None:
        rec = self.get_by_id(recipient_id)
        if rec:
            rec.status = RecipientStatus.SUCCESS
            rec.storage_key = storage_key
            rec.file_size_bytes = file_size_bytes
            rec.generated_at = utcnow()
            rec.error_message = None
            self.db.commit()

    def mark_failed(self, recipient_id: str, error_message: str) -> None:
        rec = self.get_by_id(recipient_id)
        if rec:
            rec.status = RecipientStatus.FAILED
            rec.error_message = error_message
            self.db.commit()

    def mark_invalid(self, recipient_id: str, reason: str) -> None:
        rec = self.get_by_id(recipient_id)
        if rec:
            rec.status = RecipientStatus.INVALID
            rec.error_message = reason
            self.db.commit()

    def get_successful_recipients(self, job_id: str) -> list[RecipientCertificate]:
        return (
            self.db.query(RecipientCertificate)
            .filter(
                RecipientCertificate.job_id == job_id,
                RecipientCertificate.status == RecipientStatus.SUCCESS
            )
            .all()
        )

    def get_failed_recipients(self, job_id: str) -> list[RecipientCertificate]:
        return (
            self.db.query(RecipientCertificate)
            .filter(
                RecipientCertificate.job_id == job_id,
                RecipientCertificate.status.in_([RecipientStatus.FAILED, RecipientStatus.INVALID])
            )
            .all()
        )

    def reset_failed_for_retry(self, job_id: str) -> int:
        failures = (
            self.db.query(RecipientCertificate)
            .filter(
                RecipientCertificate.job_id == job_id,
                RecipientCertificate.status == RecipientStatus.FAILED
            )
            .all()
        )
        count = len(failures)
        for r in failures:
            r.status = RecipientStatus.PENDING
            r.error_message = None
            r.retry_count += 1
        self.db.commit()
        return count
