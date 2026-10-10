from app.core.config import settings
from app.storage.base import BaseStorage
from app.storage.local import LocalStorage
from app.storage.s3 import S3Storage

_storage_instance = None


def get_storage() -> BaseStorage:
    global _storage_instance
    if _storage_instance is None:
        if settings.STORAGE_TYPE.lower() == "s3" and settings.S3_BUCKET_NAME:
            _storage_instance = S3Storage()
        else:
            _storage_instance = LocalStorage()
    return _storage_instance
