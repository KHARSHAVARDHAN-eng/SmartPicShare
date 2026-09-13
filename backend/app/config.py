from typing import Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings loaded from environment variables or .env file.
    """
    PROJECT_NAME: str = "SmartSharePhoto API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/smartsharephoto_dev"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/smartsharephoto_dev"

    # Supabase Auth & Storage Settings
    SUPABASE_URL: Optional[str] = "https://oqlxlstsycgvzitjtotc.supabase.co"
    SUPABASE_JWT_SECRET: Optional[str] = "dev-secret-key-change-in-production-min-32-chars"
    SUPABASE_ALGORITHM: str = "HS256"
    SUPABASE_STORAGE_BUCKET: str = "smartphotoshare"
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    # Cloudflare R2 Object Storage
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: str = "smartsharephoto-photos"
    R2_ENDPOINT: Optional[str] = None

    # Backblaze B2 Object Storage
    B2_ENDPOINT: Optional[str] = "https://s3.us-east-005.backblazeb2.com"
    B2_REGION: Optional[str] = "us-east-005"
    B2_BUCKET_NAME: str = "SmartPhotoShare"
    B2_KEY_ID: Optional[str] = None
    B2_APPLICATION_KEY: Optional[str] = None

    STORAGE_PROVIDER: str = "supabase"  # Options: 'supabase', 'b2', 'r2', 'mock'

    # Application Business & Face Recognition Limits
    MAX_PHOTOS_PER_EVENT: int = 150
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    MAX_SELFIE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    FACE_MATCH_THRESHOLD: float = 0.45  # Configurable Cosine Similarity threshold (0.0 to 1.0)

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://smartpicshare-frontend.onrender.com",
        "https://smartpicshare.onrender.com",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, list[str]]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str):
            import json
            return json.loads(v)
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    @field_validator("DATABASE_URL", "SYNC_DATABASE_URL", mode="before")
    @classmethod
    def sanitize_database_url(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            return v
        try:
            from sqlalchemy.engine.url import make_url
            make_url(v)
            return v
        except Exception:
            try:
                from urllib.parse import quote_plus
                from sqlalchemy.engine.url import make_url
                scheme_and_user_pass, host_db = v.rsplit("@", 1)
                parts = scheme_and_user_pass.split(":", 2)
                if len(parts) == 3:
                    scheme_user = f"{parts[0]}:{parts[1]}"
                    raw_pass = parts[2]
                    enc_pass = quote_plus(raw_pass)
                    sanitized = f"{scheme_user}:{enc_pass}@{host_db}"
                    make_url(sanitized)
                    return sanitized
            except Exception:
                pass
            return v

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
