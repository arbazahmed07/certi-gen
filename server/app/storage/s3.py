import io
from typing import Optional
from app.storage.base import BaseStorage
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class S3Storage(BaseStorage):
    def __init__(self):
        try:
            import boto3
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                region_name=settings.S3_REGION_NAME
            )
            self.bucket_name = settings.S3_BUCKET_NAME
        except Exception as e:
            logger.warning(f"boto3 not configured or initialized: {e}. S3Storage will fail if called.")
            self.s3_client = None
            self.bucket_name = None

    def save_bytes(self, key: str, data: bytes, content_type: str = "application/pdf") -> str:
        if not self.s3_client or not self.bucket_name:
            raise RuntimeError("S3 client is not configured properly.")
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=data,
            ContentType=content_type
        )
        return key

    def get_bytes(self, key: str) -> Optional[bytes]:
        if not self.s3_client or not self.bucket_name:
            raise RuntimeError("S3 client is not configured properly.")
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            return response["Body"].read()
        except Exception:
            return None

    def exists(self, key: str) -> bool:
        if not self.s3_client or not self.bucket_name:
            return False
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        if not self.s3_client or not self.bucket_name:
            return False
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except Exception:
            return False

    def get_file_path(self, key: str) -> Optional[str]:
        return None
