from typing import Any, Dict, Optional
import jwt
from jwt import PyJWKClient
from pydantic import BaseModel

from app.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.logging import logger

_jwks_client: Optional[PyJWKClient] = None


def get_jwks_client() -> Optional[PyJWKClient]:
    """Retrieves or initializes the PyJWKClient for Supabase JWKS public key lookup."""
    global _jwks_client
    if _jwks_client is None and settings.SUPABASE_URL and settings.SUPABASE_URL.startswith("http"):
        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        try:
            _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
        except Exception as e:
            logger.warning(f"Failed to initialize PyJWKClient for {jwks_url}: {e}")
    return _jwks_client


class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "authenticated"


def verify_supabase_jwt(token: str) -> AuthenticatedUser:
    """
    Decodes and cryptographically verifies a Supabase JWT token signature.
    Supports both JWKS public key verification (ES256/RS256) and
    HMAC secret key verification (HS256).
    """
    if not token:
        raise UnauthorizedError("Authorization token is missing")

    try:
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")

        payload: Optional[Dict[str, Any]] = None

        # 1. Asymmetric verification via JWKS (for ES256/RS256 or tokens with 'kid')
        jwks_client = get_jwks_client()
        if jwks_client and ("kid" in unverified_header or alg in ["ES256", "RS256"]):
            try:
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=[alg],
                    options={"verify_aud": False},
                )
            except Exception as jwks_err:
                logger.debug(f"JWKS verification attempt failed: {jwks_err}")

        # 2. Symmetric verification via HMAC secret (for HS256)
        if payload is None:
            secret = settings.SUPABASE_JWT_SECRET or "dev-secret-key-change-in-production-min-32-chars"
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
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
