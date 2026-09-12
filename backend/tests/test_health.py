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


@pytest.mark.asyncio
async def test_cors_preflight(client: AsyncClient):
    headers = {
        "Origin": "https://smartpicshare-frontend.onrender.com",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization,content-type",
    }
    response = await client.options("/api/v1/events", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://smartpicshare-frontend.onrender.com"
    assert response.headers.get("access-control-allow-credentials") == "true"

    headers_localhost = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    response_lh = await client.options("/api/v1/events", headers=headers_localhost)
    assert response_lh.status_code == 200
    assert response_lh.headers.get("access-control-allow-origin") == "http://localhost:5173"

