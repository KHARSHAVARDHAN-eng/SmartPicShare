import uuid
from typing import Optional
from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedError
from app.core.security import AuthenticatedUser, verify_supabase_jwt
from app.db.session import get_db
from app.models.user import User
from app.services.face import FaceRecognitionService, get_face_service
from app.services.storage import StorageService, get_storage_provider


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that validates Supabase JWT from Authorization header
    and fetches/creates the corresponding User record in the database.
    """
    if not authorization:
        raise UnauthorizedError("Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedError("Invalid Authorization header format. Expected 'Bearer <token>'")

    token = parts[1]
    auth_user: AuthenticatedUser = verify_supabase_jwt(token)

    user_uuid = uuid.UUID(auth_user.id)

    # Check if user exists in local database
    stmt = select(User).where(User.id == user_uuid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        # Auto-provision user record on first JWT authentication
        user = User(
            id=user_uuid,
            email=auth_user.email,
            full_name=auth_user.full_name,
            avatar_url=auth_user.avatar_url,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user


async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Optional user authentication dependency for guest/public endpoints.
    """
    if not authorization:
        return None
    try:
        return await get_current_user(authorization=authorization, db=db)
    except Exception:
        return None


def get_storage() -> StorageService:
    return get_storage_provider()


def get_face() -> FaceRecognitionService:
    return get_face_service()
