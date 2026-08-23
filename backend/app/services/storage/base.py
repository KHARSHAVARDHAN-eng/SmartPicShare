from abc import ABC, abstractmethod


class StorageService(ABC):
    """
    Abstract Storage Service Interface for Cloud Object Storage.
    """

    @abstractmethod
    async def upload(
        self, file_bytes: bytes, storage_key: str, content_type: str
    ) -> str:
        """
        Uploads file bytes to storage and returns the storage key or URL.
        """
        pass

    @abstractmethod
    async def delete(self, storage_key: str) -> bool:
        """
        Deletes an object from storage by key.
        """
        pass

    @abstractmethod
    async def generate_signed_url(
        self, storage_key: str, expires_in: int = 3600
    ) -> str:
        """
        Generates a temporary signed URL for public or guest viewing/download.
        """
        pass

    @abstractmethod
    async def exists(self, storage_key: str) -> bool:
        """
        Checks if an object exists in storage.
        """
        pass
