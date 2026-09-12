from typing import Optional
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
    ]

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
