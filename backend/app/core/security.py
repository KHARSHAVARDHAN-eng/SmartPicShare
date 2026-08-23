from typing import Any, Dict, Optional
import jwt
from pydantic import BaseModel
from app.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.logging import logger


class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "authenticated"


def verify_supabase_jwt(token: str) -> AuthenticatedUser:
    """
    Decodes and verifies a Supabase JWT token.
    Extracts the user ID (sub), email, and user_metadata.
    """
    if not token:
        raise UnauthorizedError("Authorization token is missing")

    try:
        # In development/test mode or with Supabase JWT secret
        secret = settings.SUPABASE_JWT_SECRET or "dev-secret-key-change-in-production-min-32-chars"
        
        # Verify JWT signature
        payload: Dict[str, Any] = jwt.decode(
            token,
            secret,
            algorithms=[settings.SUPABASE_ALGORITHM],
            options={"verify_aud": False},
        )

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token payload: missing 'sub'")

        user_metadata = payload.get("user_metadata", {})
        email = payload.get("email") or user_metadata.get("email")
        full_name = user_metadata.get("full_name") or user_metadata.get("name")
        avatar_url = user_metadata.get("avatar_url") or user_metadata.get("picture")

        return AuthenticatedUser(
            id=str(user_id),
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            role=payload.get("role", "authenticated"),
        )
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("Token has expired")
    except jwt.PyJWTError as e:
        logger.warning(f"JWT verification failed: {str(e)}")
        raise UnauthorizedError("Invalid authentication token")
