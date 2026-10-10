# CertiFlow — Bulk Certificate Generator & Issuance Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1.svg?logo=postgresql&logoColor=white)](https://neon.tech)
[![Celery](https://img.shields.io/badge/Celery-5.4+-37814A.svg?logo=celery&logoColor=white)](https://docs.celeryq.dev)
[![Redis](https://img.shields.io/badge/Redis-7.2+-DC382D.svg?logo=redis&logoColor=white)](https://redis.io)

CertiFlow is a production-grade, full-stack bulk certificate generation and verification platform. It allows educational institutions, academies, and event organizers to ingest large recipient lists via JSON or CSV, validate and sanitize recipient data, render professional landscape A4 certificates asynchronously via ReportLab, track job progress in real-time, package successful credentials into ZIP archives, and export isolated failures for retry.

---

## Architecture & System Design

```
                     ┌────────────────────────────────────────┐
                     │          React + TypeScript UI         │
                     │  (Vite, Tailwind CSS, TanStack Query)  │
                     └───────────────────┬────────────────────┘
                                         │ HTTP / REST (/api/v1)
                                         ▼
                     ┌────────────────────────────────────────┐
                     │          FastAPI API Gateway           │
                     │ (Uvicorn, Pydantic v2, Error Handlers) │
                     └───────┬────────────────────────┬───────┘
                             │                        │
               Enqueues Task │                        │ SQLAlchemy 2.0
                             ▼                        ▼
               ┌───────────────────────┐   ┌───────────────────────┐
               │     Redis Broker      │   │    Neon PostgreSQL    │
               │  (Job Queue & State)  │   │ (Jobs, Recipients,    │
               └─────────────┬─────────┘   │  Certificate Indexes) │
                             │             └───────────────────────┘
                             ▼                        ▲
               ┌───────────────────────┐              │ Updates Status
               │     Celery Worker     ├──────────────┘ & Storage Keys
               │  - Bounded Batches    │
               │  - ReportLab PDF Gen  │
               │  - ZIP Archiving      │
               └─────────────┬─────────┘
                             │ Writes PDF & ZIP Binaries
                             ▼
               ┌───────────────────────────────────────┐
               │ Storage Engine: Local FS / AWS S3 / R2│
               └───────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Non-Blocking Ingestion (HTTP 202 Accepted)**:
   API requests return HTTP `202 Accepted` immediately upon scheduling the job, preventing connection timeouts during bulk submissions.
2. **Bounded Batches & Chunked Processing**:
   Recipients are processed in bounded chunks (50 per batch). This avoids memory bloat on large batches and enables horizontal scaling across multiple Celery workers.
3. **Database Transaction Isolation**:
   Database transactions are closed while generating ReportLab PDFs. Storage keys and metadata are committed in fast batch updates, eliminating lock contention.
4. **Isolated Failure Semantics**:
   A failure affecting one recipient (e.g. malformed name or rendering failure) never aborts other valid certificates. Errors are flagged individually as `failed` or `invalid`, while valid recipients complete successfully.
5. **No Binaries in Relational Database**:
   PostgreSQL stores only metadata, unique certificate IDs, and storage keys. PDF binaries and ZIP archives reside in the configured storage engine (Local Filesystem or S3-compatible object storage).
6. **Built-in Resilience Fallback**:
   If the Celery/Redis broker is temporarily unavailable in standalone local development, the service falls back to a background worker thread, ensuring development continuity.

---

## Directory Structure

```
proj/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, StatusBadge, etc.)
│   │   ├── pages/              # Dashboard, Generate, JobDetails, Library, Template, Settings
│   │   ├── services/           # Typed API Client & TanStack Query hooks
│   │   ├── test/               # Vitest component & form tests
│   │   ├── App.tsx             # Routing & Layout
│   │   └── main.tsx            # App Entrypoint
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Backend API & Worker
│   ├── alembic/                # Alembic database migrations
│   │   └── versions/           # 001_initial_schema.py
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST endpoints: jobs, certificates, health, recipients
│   │   ├── core/               # Configuration, logging, errors
│   │   ├── db/                 # SQLAlchemy Base, Engine, and Neon connection pool
│   │   ├── models/             # GenerationJob, RecipientCertificate
│   │   ├── schemas/            # Pydantic v2 validation & response models
│   │   ├── repositories/       # Job & Recipient DB query operations
│   │   ├── services/           # Validation, Certificate, Archive, Job services
│   │   ├── storage/            # Local and S3 storage implementations
│   │   ├── tasks/              # Celery worker & batch tasks
│   │   └── templates/          # Landscape A4 ReportLab PDF generator
│   ├── tests/                  # Pytest test suite (10 integration tests)
│   ├── Dockerfile              # Backend container definition
│   └── requirements.txt
├── docker-compose.yml          # Multi-container local/staging orchestration
├── .env.example                # Configuration template
└── README.md
```

---

## Prerequisites

- **Python 3.12+** (Python 3.14 supported)
- **Node.js 18+** & **npm**
- **Docker & Docker Compose** (Optional, for containerized run)
- **Redis** (Local or cloud instance)
- **PostgreSQL** (Neon PostgreSQL or local PostgreSQL/SQLite)

---

## Environment Variables

Copy `.env.example` to `server/.env`:

```env
# Neon PostgreSQL Connection URL
DATABASE_URL=postgresql+psycopg://username:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Redis & Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Storage: "local" or "s3"
STORAGE_TYPE=local
LOCAL_STORAGE_DIR=./storage_data

# AWS / Cloudflare R2 / S3 (Only required if STORAGE_TYPE=s3)
S3_BUCKET_NAME=certiflow-certificates
S3_ENDPOINT_URL=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION_NAME=us-east-1

# Organization Defaults
DEFAULT_ISSUER=CertiFlow Academy
DEFAULT_ORGANIZATION=Global Certifications Institute
```

---

## Local Development Setup

### 1. Backend Setup

```bash
cd server

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The FastAPI OpenAPI interactive documentation will be available at:
`http://localhost:8000/api/v1/docs`

### 2. Celery Worker (Optional for standalone mode)

```bash
cd server
celery -A app.tasks.celery_app.celery_app worker --loglevel=info --concurrency=4
```

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Running with Docker Compose

To spin up the complete stack (FastAPI backend, Celery worker, Redis, PostgreSQL, and Storage) in Docker:

```bash
docker-compose up --build
```

---

## Testing

### Backend Tests (pytest & HTTPX)

The test suite covers job creation, input validation, CSV parsing, PDF generation, progress tracking, isolated failure handling, retries, downloads, and cancellation:

```bash
cd server
pytest tests -v
```

### Frontend Tests (Vitest & React Testing Library)

Covers form workflows, accessible controls, and component states:

```bash
cd client
npm run test
```

---

## REST API Reference

Base URL: `/api/v1`

### 1. Create Job (JSON)
- **Method**: `POST /jobs`
- **Status**: `202 Accepted`
- **Request Body**:
```json
{
  "event_name": "DevCon 2026",
  "course_name": "Distributed Cloud Systems",
  "issuer": "Dr. Alan Turing",
  "organization": "Institute of Computing",
  "issue_date": "October 15, 2026",
  "idempotency_key": "unique-client-key-12345",
  "recipients": [
    { "recipient_name": "Ada Lovelace", "recipient_email": "ada@computing.org" },
    { "recipient_name": "Grace Hopper", "recipient_email": "grace@navy.mil" }
  ]
}
```

### 2. Upload CSV Job
- **Method**: `POST /jobs/upload-csv`
- **Status**: `202 Accepted`
- **Form Data**:
  - `course_name`: string
  - `issuer`: string
  - `organization`: string
  - `issue_date`: string
  - `event_name`: optional string
  - `file`: CSV file containing `recipient_name` and `recipient_email`

### 3. Get Job Progress
- **Method**: `GET /jobs/{job_id}/progress`
- **Response**:
```json
{
  "job_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "completed",
  "total_count": 50,
  "valid_count": 50,
  "invalid_count": 0,
  "pending_count": 0,
  "success_count": 50,
  "failed_count": 0,
  "progress_percentage": 100.0,
  "is_completed": true,
  "archive_status": "ready"
}
```

### 4. Download Certificate PDF
- **Method**: `GET /certificates/{certificate_id}/download`
- **Response**: `application/pdf` binary stream with `Content-Disposition: attachment`.

### 5. Download All Certificates (ZIP)
- **Method**: `GET /jobs/{job_id}/archive/download`
- **Response**: `application/zip` binary stream containing all generated certificates for the job.

### 6. Export Failed Recipients
- **Method**: `GET /jobs/{job_id}/failed/export`
- **Response**: `text/csv` stream with failed recipient names, emails, and error reasons.

### 7. Retry Failed Certificates
- **Method**: `POST /jobs/{job_id}/retry`
- **Status**: `200 OK`

### 8. Cancel Job
- **Method**: `POST /jobs/{job_id}/cancel`
- **Status**: `200 OK`

### 9. Verify Certificate Authenticity
- **Method**: `GET /certificates/verify/{certificate_id}`
- **Response**:
```json
{
  "valid": true,
  "certificate_id": "CERT-2026-X8B9Q2",
  "recipient_name": "Ada Lovelace",
  "course_name": "Distributed Cloud Systems",
  "organization": "Institute of Computing",
  "issuer": "Dr. Alan Turing",
  "issue_date": "October 15, 2026"
}
```

---

## Scalability Considerations & Load Strategy

1. **Streaming Ingestion**: For 100,000+ recipient files, the server streams the CSV in chunks rather than reading the entire file into memory.
2. **Bounded Celery Batches**: Workers fetch 50 recipients at a time using `LIMIT 50` queries, process them outside database transactions, and batch-update status.
3. **Queue Backpressure**: Worker prefetch multiplier is set to `1` (`worker_prefetch_multiplier=1`) to prevent individual workers from starving the queue.
4. **Neon Connection Pooling**: Connection pool sizes and recycle timeouts prevent connection exhaustion during concurrent worker activity.
5. **Horizontal Worker Scaling**: Workers can be scaled independently (`docker-compose scale worker=8`) without altering API service capacity.

---

## Security & Verification

- **Idempotency Keys**: Protects against duplicate billing or double processing on client network retries.
- **Path Traversal Protection**: Storage keys are sanitized against directory traversal attacks (`..`).
- **Cryptographic Certificate IDs**: Each certificate receives a unique, unguessable identifier (`CERT-YYYY-XXXX-XXXX`) linked to the recipient record.
- **Input Validation**: Pydantic v2 and Zod schemas enforce strict bounds on string lengths, regex patterns, and payload sizes.
