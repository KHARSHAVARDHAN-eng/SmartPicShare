import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "service" in data


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    # Test root /health endpoint
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "healthy"

    # Test /api/v1/health endpoint
    v1_response = await client.get("/api/v1/health")
    assert v1_response.status_code == 200
    v1_data = v1_response.json()
    assert v1_data["status"] == "ok"
    assert v1_data["database"] == "healthy"
