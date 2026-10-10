from abc import ABC, abstractmethod


class BaseStorage(ABC):
    @abstractmethod
    def save_bytes(self, key: str, data: bytes, content_type: str = "application/pdf") -> str:
        """Saves bytes and returns storage key."""

    @abstractmethod
    def get_bytes(self, key: str) -> bytes | None:
        """Retrieves file bytes by storage key."""

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Checks if key exists."""

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Deletes object by key."""

    @abstractmethod
    def get_file_path(self, key: str) -> str | None:
        """Returns local filesystem path if available, or None if remote."""
