FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps needed for psycopg binary wheels & reportlab
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Prefer IPv4 over IPv6 in container (prevents ENETUNREACH for cloud DBs like Neon)
RUN echo "precedence ::ffff:0:0/96  100" >> /etc/gai.conf

# ── Install Python dependencies ───────────────────────────────────────────────
COPY requirements.txt .
RUN pip install -r requirements.txt

# ── Copy application source ───────────────────────────────────────────────────
COPY . .

# Create storage directory
RUN mkdir -p /app/storage_data

EXPOSE 8000

# Default command (overridden per service in docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
