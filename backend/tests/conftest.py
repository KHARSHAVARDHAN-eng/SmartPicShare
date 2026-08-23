import asyncio
import os
import uuid
from typing import AsyncGenerator
import jwt
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.dependencies import get_db, get_storage
from app.config import settings
from app.db.base import Base
from app.main import app
from app.services.storage.mock import MockStorageService

TEST_DB_FILE = "./test_smartsharephoto.db"
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_file():
    yield
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


mock_storage = MockStorageService()


def override_get_storage():
    return mock_storage


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_storage] = override_get_storage


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as c:
        yield c


def create_test_token(user_id: str, email: str, name: str) -> str:
    secret = settings.SUPABASE_JWT_SECRET or "dev-secret-key-change-in-production-min-32-chars"
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "user_metadata": {"full_name": name, "avatar_url": "https://example.com/avatar.jpg"},
    }
    return jwt.encode(payload, secret, algorithm=settings.SUPABASE_ALGORITHM)


@pytest.fixture
def owner1_id() -> str:
    return str(uuid.uuid4())


@pytest.fixture
def owner1_token(owner1_id: str) -> str:
    return create_test_token(owner1_id, "owner1@example.com", "Owner One")


@pytest.fixture
def owner1_headers(owner1_token: str) -> dict:
    return {"Authorization": f"Bearer {owner1_token}"}


@pytest.fixture
def owner2_id() -> str:
    return str(uuid.uuid4())


@pytest.fixture
def owner2_token(owner2_id: str) -> str:
    return create_test_token(owner2_id, "owner2@example.com", "Owner Two")


@pytest.fixture
def owner2_headers(owner2_token: str) -> dict:
    return {"Authorization": f"Bearer {owner2_token}"}
