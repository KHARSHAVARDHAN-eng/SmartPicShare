import pytest
from app.services.storage import MockStorageService, get_storage_provider


@pytest.mark.asyncio
async def test_mock_storage_service_operations():
    storage = MockStorageService()

    # Upload
    key = await storage.upload(b"hello world", "test/file.txt", "text/plain")
    assert key == "test/file.txt"

    # Exists
    assert await storage.exists("test/file.txt") is True
    assert await storage.exists("nonexistent.txt") is False

    # Signed URL
    url = await storage.generate_signed_url("test/file.txt")
    assert "/api/v1/media" in url or "mock-storage" in url
    assert "test/file.txt" in url


    # Delete
    assert await storage.delete("test/file.txt") is True
    assert await storage.exists("test/file.txt") is False


def test_storage_provider_factory():
    provider = get_storage_provider()
    # By default without R2 credentials, returns MockStorageService
    assert isinstance(provider, MockStorageService)
