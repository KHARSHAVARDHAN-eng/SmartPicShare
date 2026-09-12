import asyncio
from typing import Optional, Tuple
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.config import settings
from app.core.logging import logger
from app.services.storage.base import StorageService


class BackblazeB2StorageService(StorageService):
    """
    Backblaze B2 Storage Service Adapter using S3 Compatible API (boto3).
    Provides secure upload, delete, presigned URL generation, and direct object retrieval.
    """

    def __init__(self):
        endpoint = settings.B2_ENDPOINT or "https://s3.us-east-005.backblazeb2.com"
        region = settings.B2_REGION or "us-east-005"
        self.bucket_name = settings.B2_BUCKET_NAME or "SmartPhotoShare"

        self.s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.B2_KEY_ID,
            aws_secret_access_key=settings.B2_APPLICATION_KEY,
            config=Config(signature_version="s3v4"),
            region_name=region,
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
                logger.error(f"Failed to delete {storage_key} from Backblaze B2: {str(e)}")
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

    async def get_file(self, storage_key: str) -> Tuple[Optional[bytes], Optional[str]]:
        def _get():
            try:
                res = self.s3_client.get_object(
                    Bucket=self.bucket_name, Key=storage_key
                )
                content = res["Body"].read()
                content_type = res.get("ContentType", "image/jpeg")
                return content, content_type
            except ClientError as e:
                logger.error(f"Failed to get object {storage_key} from B2: {str(e)}")
                return None, None

        return await asyncio.to_thread(_get)

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
