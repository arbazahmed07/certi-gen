from abc import ABC, abstractmethod
from typing import Optional, BinaryIO
import io


class BaseStorage(ABC):
    @abstractmethod
    def save_bytes(self, key: str, data: bytes, content_type: str = "application/pdf") -> str:
        """Saves bytes and returns storage key."""
        pass

    @abstractmethod
    def get_bytes(self, key: str) -> Optional[bytes]:
        """Retrieves file bytes by storage key."""
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Checks if key exists."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Deletes object by key."""
        pass

    @abstractmethod
    def get_file_path(self, key: str) -> Optional[str]:
        """Returns local filesystem path if available, or None if remote."""
        pass
