import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthorized_access_no_header(client: AsyncClient):
    response = await client.get("/api/v1/events")
    assert response.status_code == 401
    assert "error" in response.json()


@pytest.mark.asyncio
async def test_unauthorized_access_bad_token(client: AsyncClient):
    headers = {"Authorization": "Bearer invalid.jwt.token"}
    response = await client.get("/api/v1/events", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_authorized_access_creates_user(client: AsyncClient, owner1_headers: dict):
    response = await client.get("/api/v1/events", headers=owner1_headers)
    assert response.status_code == 200
    assert response.json() == []
