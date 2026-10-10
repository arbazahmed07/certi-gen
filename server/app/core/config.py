from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import os
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    PROJECT_NAME: str = "CertiFlow - Bulk Certificate Generator"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Database: Supports Neon PostgreSQL or local PostgreSQL / SQLite for testing
    DATABASE_URL: str = Field(
        default="sqlite:///./certiflow.db",
        description="Neon PostgreSQL connection URL or local database URL"
    )
    
    # Celery & Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    
    # Task processing configuration
    BATCH_SIZE: int = 50  # Bounded batch size for processing recipients
    MAX_RECIPIENTS_PER_JOB: int = 100000
    
    # Storage settings: "local" or "s3"
    STORAGE_TYPE: str = "local"
    LOCAL_STORAGE_DIR: str = str(Path(__file__).resolve().parent.parent.parent / "storage_data")
    
    # S3 Settings (for production)
    S3_BUCKET_NAME: Optional[str] = None
    S3_ENDPOINT_URL: Optional[str] = None
    S3_ACCESS_KEY_ID: Optional[str] = None
    S3_SECRET_ACCESS_KEY: Optional[str] = None
    S3_REGION_NAME: str = "us-east-1"

    # Certificate Defaults
    DEFAULT_ISSUER: str = "CertiFlow Academy"
    DEFAULT_ORGANIZATION: str = "Global Certifications Institute"

    @property
    def broker_url(self) -> str:
        return self.CELERY_BROKER_URL or self.REDIS_URL

    @property
    def result_backend(self) -> str:
        return self.CELERY_RESULT_BACKEND or self.REDIS_URL


settings = Settings()
