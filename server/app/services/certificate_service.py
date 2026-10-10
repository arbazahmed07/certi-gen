import logging
import uuid

from app.storage import get_storage
from app.templates.certificate_pdf import CertificateGenerator

logger = logging.getLogger(__name__)


class CertificateService:
    @staticmethod
    def generate_certificate_id() -> str:
        random_code = uuid.uuid4().hex[:8].upper()
        return f"CERT-2026-{random_code}"

    @classmethod
    def render_and_store_pdf(
        cls,
        certificate_id: str,
        recipient_name: str,
        course_name: str,
        issuer: str,
        organization: str,
        issue_date: str,
        event_name: str | None = None
    ) -> tuple[str, int]:
        """
        Renders the PDF and commits it to the configured storage engine.
        Returns: (storage_key, file_size_bytes)
        """
        pdf_bytes = CertificateGenerator.generate_pdf(
            certificate_id=certificate_id,
            recipient_name=recipient_name,
            course_name=course_name,
            issuer=issuer,
            organization=organization,
            issue_date=issue_date,
            event_name=event_name
        )

        storage = get_storage()
        storage_key = f"certificates/{certificate_id}.pdf"
        storage.save_bytes(storage_key, pdf_bytes, content_type="application/pdf")

        return storage_key, len(pdf_bytes)
