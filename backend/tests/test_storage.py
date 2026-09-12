from unittest.mock import MagicMock, patch
import pytest
from app.config import settings
from app.services.storage import BackblazeB2StorageService, MockStorageService, SupabaseStorageService, get_storage_provider


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


@pytest.mark.asyncio
async def test_supabase_storage_service_operations():
    with patch("requests.post") as mock_post, \
         patch("requests.get") as mock_get, \
         patch("requests.delete") as mock_delete:
        
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"signedURL": "/storage/v1/object/sign/smartphotoshare/photo.jpg?token=abc"}
        mock_get.return_value.status_code = 200
        mock_get.return_value.content = b"supabase_fake_img"
        mock_get.return_value.headers = {"Content-Type": "image/jpeg"}
        mock_delete.return_value.status_code = 200

        storage = SupabaseStorageService()

        # Upload
        key = await storage.upload(b"supabase_fake_img", "events/123/original/photo.jpg", "image/jpeg")
        assert key == "events/123/original/photo.jpg"

        # Signed URL
        signed_url = await storage.generate_signed_url("events/123/original/photo.jpg")
        assert "supabase.co" in signed_url
        assert "token=abc" in signed_url

        # Get file
        data, content_type = await storage.get_file("events/123/original/photo.jpg")
        assert data == b"supabase_fake_img"
        assert content_type == "image/jpeg"

        # Exists
        assert await storage.exists("events/123/original/photo.jpg") is True

        # Delete
        assert await storage.delete("events/123/original/photo.jpg") is True


def test_storage_provider_factory():
    with patch.object(settings, "STORAGE_PROVIDER", "supabase"), patch("requests.get"):
        provider = get_storage_provider()
        assert isinstance(provider, SupabaseStorageService)

    with patch.object(settings, "STORAGE_PROVIDER", "mock"):
        provider = get_storage_provider()
        assert isinstance(provider, MockStorageService)

    with patch.object(settings, "STORAGE_PROVIDER", "b2"), \
         patch.object(settings, "B2_KEY_ID", "test_key"), \
         patch.object(settings, "B2_APPLICATION_KEY", "test_secret"), \
         patch("boto3.client"):
        b2_provider = get_storage_provider()
        assert isinstance(b2_provider, BackblazeB2StorageService)

    with patch.object(settings, "STORAGE_PROVIDER", "b2"), \
         patch.object(settings, "B2_KEY_ID", None):
        with pytest.raises(ValueError, match="B2_KEY_ID or B2_APPLICATION_KEY"):
            get_storage_provider()


