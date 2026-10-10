import os
from pathlib import Path
from typing import Optional
from app.storage.base import BaseStorage
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class LocalStorage(BaseStorage):
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.LOCAL_STORAGE_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, key: str) -> Path:
        # Sanitize path to prevent directory traversal
        sanitized = os.path.normpath(key).lstrip("\\/").replace("..", "")
        return self.base_dir / sanitized

    def save_bytes(self, key: str, data: bytes, content_type: str = "application/pdf") -> str:
        target_path = self._resolve_path(key)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, "wb") as f:
            f.write(data)
        logger.debug(f"Saved {len(data)} bytes to {target_path}")
        return key

    def get_bytes(self, key: str) -> Optional[bytes]:
        target_path = self._resolve_path(key)
        if not target_path.exists():
            return None
        with open(target_path, "rb") as f:
            return f.read()

    def exists(self, key: str) -> bool:
        target_path = self._resolve_path(key)
        return target_path.exists() and target_path.is_file()

    def delete(self, key: str) -> bool:
        target_path = self._resolve_path(key)
        if target_path.exists():
            target_path.unlink()
            return True
        return False

    def get_file_path(self, key: str) -> Optional[str]:
        target_path = self._resolve_path(key)
        if target_path.exists():
            return str(target_path)
        return None
