from app.templates.certificate_pdf import CertificateGenerator


def test_certificate_pdf_generation():
    pdf_bytes = CertificateGenerator.generate_pdf(
        certificate_id="CERT-2026-TEST9999",
        recipient_name="Eleanor Vance",
        course_name="Distributed Cloud Architectures",
        issuer="Dr. Robert Lang",
        organization="Cloud Engineering Institute",
        issue_date="October 15, 2026",
        event_name="Summit 2026"
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    # PDF starts with %PDF
    assert pdf_bytes.startswith(b"%PDF")
