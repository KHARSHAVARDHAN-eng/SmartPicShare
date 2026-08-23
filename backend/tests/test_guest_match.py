import io
import uuid
import pytest
from httpx import AsyncClient
from PIL import Image

from app.models import Event, FaceEmbedding, Photo, User
from tests.test_face_engine import MockFaceRecognitionService, create_synthetic_test_image


@pytest.mark.asyncio
async def test_guest_match_unauthenticated(client: AsyncClient):
    fake_id = uuid.uuid4()
    resp = await client.post(f"/api/v1/events/{fake_id}/match")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_guest_match_event_not_found(client: AsyncClient, owner1_headers: dict):
    fake_id = uuid.uuid4()
    jpg_bytes = create_synthetic_test_image(num_faces=1)
    file_payload = [("file", ("selfie.jpg", jpg_bytes, "image/jpeg"))]

    resp = await client.post(
        f"/api/v1/events/{fake_id}/match",
        files=file_payload,
        headers=owner1_headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_guest_match_successful_and_event_isolated(
    client: AsyncClient, owner1_headers: dict, owner2_headers: dict
):
    from app.api.dependencies import get_face
    from app.main import app

    app.dependency_overrides[get_face] = lambda: MockFaceRecognitionService()

    # 1. Create Event A & Event B
    evt_a_resp = await client.post(
        "/api/v1/events", json={"name": "Guest Event A"}, headers=owner1_headers
    )
    assert evt_a_resp.status_code == 201
    evt_a_id = evt_a_resp.json()["id"]

    evt_b_resp = await client.post(
        "/api/v1/events", json={"name": "Guest Event B"}, headers=owner2_headers
    )
    assert evt_b_resp.status_code == 201
    evt_b_id = evt_b_resp.json()["id"]

    # 2. Upload 1-face photo to Event A
    valid_jpg_bytes = create_synthetic_test_image(num_faces=1)
    upload_resp = await client.post(
        f"/api/v1/events/{evt_a_id}/photos",
        files=[("files", ("event_a_photo.jpg", valid_jpg_bytes, "image/jpeg"))],
        headers=owner1_headers,
    )
    assert upload_resp.status_code == 201
    photo_a_id = upload_resp.json()["uploaded_photos"][0]["id"]

    # 3. Guest performs selfie match on Event A
    file_payload = [("file", ("guest_selfie.jpg", valid_jpg_bytes, "image/jpeg"))]
    match_resp = await client.post(
        f"/api/v1/events/{evt_a_id}/match",
        files=file_payload,
        headers=owner2_headers,
    )
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    assert match_data["event_id"] == evt_a_id
    assert match_data["match_count"] >= 1
    assert match_data["matches"][0]["photo_id"] == photo_a_id
    assert "url" in match_data["matches"][0]
    assert match_data["matches"][0]["similarity"] >= 0.80

    # 4. Strict Event Isolation Check: Guest searches Event B -> Must return 0 matches
    match_b_resp = await client.post(
        f"/api/v1/events/{evt_b_id}/match",
        files=file_payload,
        headers=owner2_headers,
    )
    assert match_b_resp.status_code == 200
    match_b_data = match_b_resp.json()
    assert match_b_data["event_id"] == evt_b_id
    assert match_b_data["match_count"] == 0


@pytest.mark.asyncio
async def test_guest_match_selfie_rules_validation(
    client: AsyncClient, owner1_headers: dict
):
    from app.api.dependencies import get_face
    from app.main import app

    app.dependency_overrides[get_face] = lambda: MockFaceRecognitionService()

    evt_resp = await client.post(
        "/api/v1/events", json={"name": "Selfie Rules Event"}, headers=owner1_headers
    )
    evt_id = evt_resp.json()["id"]

    # 1. Test 0 faces detected error
    no_face_bytes = create_synthetic_test_image(num_faces=0)
    no_face_resp = await client.post(
        f"/api/v1/events/{evt_id}/match",
        files=[("file", ("no_face.jpg", no_face_bytes, "image/jpeg"))],
        headers=owner1_headers,
    )
    assert no_face_resp.status_code == 400
    assert "detect a face" in no_face_resp.json()["error"]["message"]

    # 2. Test multiple faces detected error
    two_face_bytes = create_synthetic_test_image(num_faces=2)
    two_face_resp = await client.post(
        f"/api/v1/events/{evt_id}/match",
        files=[("file", ("two_faces.jpg", two_face_bytes, "image/jpeg"))],
        headers=owner1_headers,
    )
    assert two_face_resp.status_code == 400
    assert "Multiple faces" in two_face_resp.json()["error"]["message"]
