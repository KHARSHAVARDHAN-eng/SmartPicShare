import io
import pytest
from PIL import Image
from httpx import AsyncClient
from tests.test_face_engine import create_synthetic_test_image


def get_tiny_jpg_bytes() -> bytes:
    img = Image.new("RGB", (10, 10), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_photo_upload_and_listing(client: AsyncClient, owner1_headers: dict):
    # 1. Create event
    evt_resp = await client.post(
        "/api/v1/events",
        json={"name": "Photo Test Event"},
        headers=owner1_headers,
    )
    assert evt_resp.status_code == 201
    event_id = evt_resp.json()["id"]

    # 2. Upload valid synthetic JPEG image file
    valid_jpg_bytes = create_synthetic_test_image(num_faces=1)
    file_payload = [
        (
            "files",
            ("test_photo.jpg", valid_jpg_bytes, "image/jpeg"),
        )
    ]
    upload_resp = await client.post(
        f"/api/v1/events/{event_id}/photos",
        files=file_payload,
        headers=owner1_headers,
    )
    assert upload_resp.status_code == 201
    data = upload_resp.json()
    assert "uploaded_photos" in data
    assert len(data["uploaded_photos"]) == 1
    photo = data["uploaded_photos"][0]
    assert photo["original_filename"] == "test_photo.jpg"
    assert "public_url" in photo
    photo_id = photo["id"]

    # 3. List photos
    list_resp = await client.get(
        f"/api/v1/events/{event_id}/photos", headers=owner1_headers
    )
    assert list_resp.status_code == 200
    photos = list_resp.json()
    assert len(photos) == 1
    assert photos[0]["id"] == photo_id

    # 4. Delete photo
    del_resp = await client.delete(
        f"/api/v1/photos/{photo_id}", headers=owner1_headers
    )
    assert del_resp.status_code == 204


@pytest.mark.asyncio
async def test_enforce_150_photo_limit(client: AsyncClient, owner1_headers: dict):
    # Create event
    evt_resp = await client.post(
        "/api/v1/events",
        json={"name": "Limit Test Event"},
        headers=owner1_headers,
    )
    assert evt_resp.status_code == 201
    event_id = evt_resp.json()["id"]

    tiny_bytes = get_tiny_jpg_bytes()
    # Attempt to upload 151 photos in a single batch
    files_payload = [
        (
            "files",
            (f"photo_{i}.jpg", tiny_bytes, "image/jpeg"),
        )
        for i in range(151)
    ]

    upload_resp = await client.post(
        f"/api/v1/events/{event_id}/photos",
        files=files_payload,
        headers=owner1_headers,
    )
    assert upload_resp.status_code == 400
    err_data = upload_resp.json()
    assert "Event photo limit exceeded" in err_data["error"]["message"]
