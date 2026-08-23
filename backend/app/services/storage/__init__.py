from app.config import settings
from app.services.storage.base import StorageService
from app.services.storage.mock import MockStorageService
from app.services.storage.r2 import CloudflareR2StorageService


def get_storage_provider() -> StorageService:
    """
    Factory function returning the configured StorageService implementation.
    """
    if settings.STORAGE_PROVIDER == "r2" and settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID:
        return CloudflareR2StorageService()
    return MockStorageService()


__all__ = [
    "StorageService",
    "CloudflareR2StorageService",
    "MockStorageService",
    "get_storage_provider",
]
