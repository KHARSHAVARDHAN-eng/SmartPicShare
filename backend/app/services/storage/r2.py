import asyncio
from typing import Optional
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.config import settings
from app.core.logging import logger
from app.services.storage.base import StorageService


class CloudflareR2StorageService(StorageService):
    """
    Cloudflare R2 Storage Service Adapter using S3 Compatible API (boto3).
    """

    def __init__(self):
        endpoint = settings.R2_ENDPOINT or (
            f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
            if settings.R2_ACCOUNT_ID
            else None
        )

        self.bucket_name = settings.R2_BUCKET_NAME
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    async def upload(
        self, file_bytes: bytes, storage_key: str, content_type: str
    ) -> str:
        def _upload():
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=storage_key,
                Body=file_bytes,
                ContentType=content_type,
            )
            return storage_key

        return await asyncio.to_thread(_upload)

    async def delete(self, storage_key: str) -> bool:
        def _delete():
            try:
                self.s3_client.delete_object(
                    Bucket=self.bucket_name, Key=storage_key
                )
                return True
            except ClientError as e:
                logger.error(f"Failed to delete {storage_key} from R2: {str(e)}")
                return False

        return await asyncio.to_thread(_delete)

    async def generate_signed_url(
        self, storage_key: str, expires_in: int = 3600
    ) -> str:
        def _generate():
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": storage_key},
                ExpiresIn=expires_in,
            )

        return await asyncio.to_thread(_generate)

    async def exists(self, storage_key: str) -> bool:
        def _check():
            try:
                self.s3_client.head_object(
                    Bucket=self.bucket_name, Key=storage_key
                )
                return True
            except ClientError:
                return False

        return await asyncio.to_thread(_check)
