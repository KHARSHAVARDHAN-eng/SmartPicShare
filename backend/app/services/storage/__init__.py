from app.config import settings
from app.services.storage.b2 import BackblazeB2StorageService
from app.services.storage.base import StorageService
from app.services.storage.mock import MockStorageService
from app.services.storage.r2 import CloudflareR2StorageService
from app.services.storage.supabase import SupabaseStorageService


def get_storage_provider() -> StorageService:
    """
    Factory function returning the configured StorageService implementation.
    Supports 'supabase', 'b2', 'r2', and 'mock'.
    """
    if settings.STORAGE_PROVIDER == "supabase":
        return SupabaseStorageService()

    if settings.STORAGE_PROVIDER == "b2":
        if not (settings.B2_KEY_ID and settings.B2_APPLICATION_KEY):
            raise ValueError(
                "STORAGE_PROVIDER is set to 'b2', but B2_KEY_ID or B2_APPLICATION_KEY environment variables are missing."
            )
        return BackblazeB2StorageService()

    if settings.STORAGE_PROVIDER == "r2":
        if not (settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY):
            raise ValueError(
                "STORAGE_PROVIDER is set to 'r2', but R2 credentials are missing."
            )
        return CloudflareR2StorageService()

    return MockStorageService()


__all__ = [
    "StorageService",
    "SupabaseStorageService",
    "BackblazeB2StorageService",
    "CloudflareR2StorageService",
    "MockStorageService",
    "get_storage_provider",
]


