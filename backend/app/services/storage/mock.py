import os
from pathlib import Path
from typing import Dict, Optional, Tuple
from app.services.storage.base import StorageService

_IN_MEMORY_STORAGE: Dict[str, bytes] = {}
_IN_MEMORY_CONTENT_TYPES: Dict[str, str] = {}
UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads"


class MockStorageService(StorageService):
    """
    Persistent local storage service for development and testing.
    Stores files in memory and persists to disk under backend/uploads/.
    """

    def __init__(self):
        self._storage = _IN_MEMORY_STORAGE
        self._content_types = _IN_MEMORY_CONTENT_TYPES
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    async def upload(
        self, file_bytes: bytes, storage_key: str, content_type: str
    ) -> str:
        self._storage[storage_key] = file_bytes
        self._content_types[storage_key] = content_type

        file_path = UPLOADS_DIR / storage_key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(file_bytes)
        return storage_key

    async def delete(self, storage_key: str) -> bool:
        existed = False
        if storage_key in self._storage:
            del self._storage[storage_key]
            self._content_types.pop(storage_key, None)
            existed = True

        file_path = UPLOADS_DIR / storage_key
        if file_path.exists():
            file_path.unlink()
            existed = True

        return existed

    async def generate_signed_url(
        self, storage_key: str, expires_in: int = 3600
    ) -> str:
        return f"/api/v1/media/{storage_key}"

    async def get_file(self, storage_key: str) -> Tuple[Optional[bytes], Optional[str]]:
        if storage_key in self._storage:
            return self._storage[storage_key], self._content_types.get(storage_key, "image/jpeg")

        file_path = UPLOADS_DIR / storage_key
        if file_path.exists():
            content = file_path.read_bytes()
            content_type = "image/png" if storage_key.endswith(".png") else "image/jpeg"
            self._storage[storage_key] = content
            self._content_types[storage_key] = content_type
            return content, content_type

        return None, None

    async def exists(self, storage_key: str) -> bool:
        if storage_key in self._storage:
            return True
        file_path = UPLOADS_DIR / storage_key
        return file_path.exists()
