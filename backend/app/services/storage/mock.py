from typing import Dict
from app.services.storage.base import StorageService


class MockStorageService(StorageService):
    """
    In-memory mock storage service for unit tests and local dev without R2 credentials.
    """

    def __init__(self):
        self._storage: Dict[str, bytes] = {}
        self._content_types: Dict[str, str] = {}

    async def upload(
        self, file_bytes: bytes, storage_key: str, content_type: str
    ) -> str:
        self._storage[storage_key] = file_bytes
        self._content_types[storage_key] = content_type
        return storage_key

    async def delete(self, storage_key: str) -> bool:
        if storage_key in self._storage:
            del self._storage[storage_key]
            self._content_types.pop(storage_key, None)
            return True
        return False

    async def generate_signed_url(
        self, storage_key: str, expires_in: int = 3600
    ) -> str:
        return f"https://mock-storage.smartsharephoto.local/{storage_key}"

    async def exists(self, storage_key: str) -> bool:
        return storage_key in self._storage
