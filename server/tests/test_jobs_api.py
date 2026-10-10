import io
from fastapi.testclient import TestClient
from app.tasks.generation_tasks import run_job_processing


def test_health_endpoints(client: TestClient):
    res_live = client.get("/api/v1/health/live")
    assert res_live.status_code == 200
    assert res_live.json()["status"] == "alive"

    res_ready = client.get("/api/v1/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"


def test_create_and_process_job(client: TestClient):
    payload = {
        "event_name": "DevCon 2026",
        "course_name": "Full-Stack Microservices Architecture",
        "issuer": "Prof. Alan Turing",
        "organization": "Institute of Computing",
        "issue_date": "October 20, 2026",
        "idempotency_key": "test-key-001",
        "recipients": [
            {"recipient_name": "Ada Lovelace", "recipient_email": "ada@example.com"},
            {"recipient_name": "Grace Hopper", "recipient_email": "grace@example.com"},
            {"recipient_name": "X", "recipient_email": "bad"}  # Invalid entry to test error isolation
        ]
    }

    # 1. Job creation returns 202 Accepted
    resp = client.post("/api/v1/jobs", json=payload)
    assert resp.status_code == 202
    data = resp.json()
    job_id = data["id"]
    assert job_id is not None
    assert data["total_count"] == 3
    assert data["valid_count"] == 2
    assert data["invalid_count"] == 1

    # 2. Idempotency test: submitting same key returns existing job
    resp_dup = client.post("/api/v1/jobs", json=payload)
    assert resp_dup.status_code == 202
    assert resp_dup.json()["id"] == job_id

    # 3. Process job synchronously
    run_job_processing(job_id)

    # 4. Check progress & completed status
    prog_resp = client.get(f"/api/v1/jobs/{job_id}/progress")
    assert prog_resp.status_code == 200
    prog = prog_resp.json()
    assert prog["status"] in ["completed", "completed_with_errors"]
    assert prog["success_count"] == 2
    assert prog["invalid_count"] == 1
    assert prog["is_completed"] is True

    # 5. List recipients for job
    rec_resp = client.get(f"/api/v1/jobs/{job_id}/recipients")
    assert rec_resp.status_code == 200
    rec_data = rec_resp.json()
    assert rec_data["total"] == 3

    # Find successful recipient
    success_rec = next(r for r in rec_data["items"] if r["status"] == "success")
    cert_id = success_rec["certificate_id"]

    # 6. Verify certificate via public verification route
    verify_resp = client.get(f"/api/v1/certificates/verify/{cert_id}")
    assert verify_resp.status_code == 200
    assert verify_resp.json()["valid"] is True
    assert verify_resp.json()["recipient_name"] in ["Ada Lovelace", "Grace Hopper"]

    # 7. Download certificate PDF
    pdf_resp = client.get(f"/api/v1/certificates/{cert_id}/download")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert pdf_resp.content.startswith(b"%PDF")

    # 8. Export failed recipients as CSV
    failed_resp = client.get(f"/api/v1/jobs/{job_id}/failed/export")
    assert failed_resp.status_code == 200
    assert "text/csv" in failed_resp.headers["content-type"]
    assert "Certificate ID" in failed_resp.text

    # 9. Download ZIP archive
    zip_resp = client.get(f"/api/v1/jobs/{job_id}/archive/download")
    assert zip_resp.status_code == 200
    assert zip_resp.headers["content-type"] == "application/zip"
    assert len(zip_resp.content) > 500


def test_upload_csv_flow(client: TestClient):
    csv_bytes = b"recipient_name,recipient_email\nMargaret Hamilton,margaret@nasa.gov\nKatherine Johnson,katherine@nasa.gov\n"
    
    files = {"file": ("test_students.csv", csv_bytes, "text/csv")}
    data = {
        "course_name": "Apollo Guidance Computing",
        "issuer": "NASA Flight Operations",
        "organization": "NASA",
        "issue_date": "July 20, 1969",
        "event_name": "Apollo 11"
    }

    resp = client.post("/api/v1/jobs/upload-csv", data=data, files=files)
    assert resp.status_code == 202
    job_id = resp.json()["id"]

    # Process job synchronously
    run_job_processing(job_id)

    # Check progress
    prog_resp = client.get(f"/api/v1/jobs/{job_id}/progress")
    assert prog_resp.status_code == 200
    assert prog_resp.json()["success_count"] == 2
    assert prog_resp.json()["status"] == "completed"


def test_job_cancellation(client: TestClient):
    payload = {
        "course_name": "Quantum Computing",
        "issuer": "Dr. Feynman",
        "organization": "Quantum Labs",
        "issue_date": "November 1, 2026",
        "recipients": [
            {"recipient_name": f"Student {i}", "recipient_email": f"student{i}@test.com"}
            for i in range(10)
        ]
    }
    resp = client.post("/api/v1/jobs", json=payload)
    assert resp.status_code == 202
    job_id = resp.json()["id"]

    # Cancel job
    cancel_resp = client.post(f"/api/v1/jobs/{job_id}/cancel")
    assert cancel_resp.status_code == 200

    prog_resp = client.get(f"/api/v1/jobs/{job_id}/progress")
    assert prog_resp.json()["status"] == "cancelled"


def test_verify_nonexistent_certificate(client: TestClient):
    resp = client.get("/api/v1/certificates/verify/NON-EXISTENT-ID")
    assert resp.status_code == 200
    assert resp.json()["valid"] is False


def test_job_retry_flow(client: TestClient):
    payload = {
        "course_name": "Resilient Systems",
        "issuer": "Dr. Leslie Lamport",
        "organization": "ACM",
        "issue_date": "October 2026",
        "recipients": [
            {"recipient_name": "Valid Recipient", "recipient_email": "valid@test.com"}
        ]
    }
    resp = client.post("/api/v1/jobs", json=payload)
    job_id = resp.json()["id"]
    run_job_processing(job_id)

    # Calling retry on completed job without failures should return 409 Conflict
    retry_resp = client.post(f"/api/v1/jobs/{job_id}/retry")
    assert retry_resp.status_code == 409

