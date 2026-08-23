import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_event(client: AsyncClient, owner1_headers: dict):
    # 1. Create Event
    create_resp = await client.post(
        "/api/v1/events",
        json={"name": "Summer Gala 2026"},
        headers=owner1_headers,
    )
    assert create_resp.status_code == 201
    event_data = create_resp.json()
    assert event_data["name"] == "Summer Gala 2026"
    assert event_data["max_photos"] == 150
    assert "slug" in event_data
    event_id = event_data["id"]
    slug = event_data["slug"]

    # 2. List Events
    list_resp = await client.get("/api/v1/events", headers=owner1_headers)
    assert list_resp.status_code == 200
    events = list_resp.json()
    assert len(events) == 1
    assert events[0]["id"] == event_id
    assert events[0]["photo_count"] == 0

    # 3. Public Event Lookup (unauthenticated)
    pub_resp = await client.get(f"/api/v1/events/public/{slug}")
    assert pub_resp.status_code == 200
    pub_data = pub_resp.json()
    assert pub_data["name"] == "Summer Gala 2026"
    assert pub_data["slug"] == slug
    assert pub_data["photo_count"] == 0


@pytest.mark.asyncio
async def test_event_ownership_isolation(
    client: AsyncClient, owner1_headers: dict, owner2_headers: dict
):
    # Owner 1 creates event
    create_resp = await client.post(
        "/api/v1/events",
        json={"name": "Owner1 Private Birthday"},
        headers=owner1_headers,
    )
    assert create_resp.status_code == 201
    event_id = create_resp.json()["id"]

    # Owner 2 attempts to view Owner 1's event -> 403 Forbidden
    get_resp = await client.get(f"/api/v1/events/{event_id}", headers=owner2_headers)
    assert get_resp.status_code == 403

    # Owner 2 attempts to delete Owner 1's event -> 403 Forbidden
    del_resp = await client.delete(f"/api/v1/events/{event_id}", headers=owner2_headers)
    assert del_resp.status_code == 403

    # Owner 1 can view and delete their own event
    owner1_get = await client.get(f"/api/v1/events/{event_id}", headers=owner1_headers)
    assert owner1_get.status_code == 200

    owner1_del = await client.delete(f"/api/v1/events/{event_id}", headers=owner1_headers)
    assert owner1_del.status_code == 204
