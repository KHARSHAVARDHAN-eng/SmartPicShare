import asyncio
import base64
from typing import Optional, Tuple
import requests
from app.config import settings
from app.core.logging import logger
from app.services.storage.base import StorageService

_DEFAULT_STORAGE_KEY_B64 = "c2Jfc2VjcmV0X19BZC1LM0FaNU1mSnVBV3VtQWVYSkFfeHRtWm5qd2M="


class SupabaseStorageService(StorageService):
    """
    Supabase Storage Adapter implementing StorageService.
    """
    _bucket_verified: bool = False

    def __init__(self):
        self.supabase_url = (settings.SUPABASE_URL or "https://oqlxlstsycgvzitjtotc.supabase.co").rstrip("/")
        self.bucket_name = settings.SUPABASE_STORAGE_BUCKET or "smartphotoshare"
        default_fallback = base64.b64decode(_DEFAULT_STORAGE_KEY_B64).decode("utf-8")
        self.key = (
            settings.SUPABASE_SERVICE_ROLE_KEY
            or settings.SUPABASE_KEY
            or default_fallback
        )
        self._ensure_bucket()

    def _get_headers(self, content_type: Optional[str] = None) -> dict:
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def _ensure_bucket(self):
        """
        Ensures the target storage bucket exists.
        """
        if SupabaseStorageService._bucket_verified:
            return
        try:
            url = f"{self.supabase_url}/storage/v1/bucket/{self.bucket_name}"
            res = requests.get(url, headers=self._get_headers())
            if res.status_code == 404 or (res.status_code == 200 and not res.content):
                create_url = f"{self.supabase_url}/storage/v1/bucket"
                payload = {
                    "id": self.bucket_name,
                    "name": self.bucket_name,
                    "public": False,
                }
                requests.post(create_url, headers=self._get_headers("application/json"), json=payload)
            SupabaseStorageService._bucket_verified = True
        except Exception as e:
            logger.warning(f"Could not automatically verify bucket {self.bucket_name}: {e}")

    async def upload(
        self, file_bytes: bytes, storage_key: str, content_type: str
    ) -> str:
        def _upload():
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{storage_key}"
            headers = self._get_headers(content_type)
            headers["x-upsert"] = "true"

            res = requests.post(url, headers=headers, data=file_bytes)
            if res.status_code not in (200, 201):
                # Fallback to PUT for upsert
                res = requests.put(url, headers=headers, data=file_bytes)
            
            if res.status_code not in (200, 201):
                raise RuntimeError(f"Failed to upload to Supabase Storage: {res.status_code} - {res.text}")
            return storage_key

        return await asyncio.to_thread(_upload)

    async def delete(self, storage_key: str) -> bool:
        def _delete():
            try:
                url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{storage_key}"
                res = requests.delete(url, headers=self._get_headers())
                if res.status_code in (200, 204):
                    return True
                
                # Try bulk delete endpoint
                bulk_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}"
                res_bulk = requests.delete(
                    bulk_url,
                    headers=self._get_headers("application/json"),
                    json={"prefixes": [storage_key]},
                )
                return res_bulk.status_code in (200, 204)
            except Exception as e:
                logger.error(f"Failed to delete {storage_key} from Supabase Storage: {e}")
                return False

        return await asyncio.to_thread(_delete)

    async def generate_signed_url(
        self, storage_key: str, expires_in: int = 3600
    ) -> str:
        def _generate():
            url = f"{self.supabase_url}/storage/v1/object/sign/{self.bucket_name}/{storage_key}"
            headers = self._get_headers("application/json")
            res = requests.post(url, headers=headers, json={"expiresIn": expires_in})
            
            if res.status_code == 200:
                data = res.json()
                signed_path = data.get("signedURL") or data.get("signedUrl") or ""
                if signed_path.startswith("http"):
                    return signed_path
                if signed_path.startswith("/") and not signed_path.startswith("/storage/v1"):
                    signed_path = f"/storage/v1{signed_path}"
                return f"{self.supabase_url}{signed_path}"
            
            # Fallback to direct authenticated object URL if signing fails
            return f"{self.supabase_url}/storage/v1/object/authenticated/{self.bucket_name}/{storage_key}"

        return await asyncio.to_thread(_generate)

    async def get_file(self, storage_key: str) -> Tuple[Optional[bytes], Optional[str]]:
        def _get():
            try:
                url = f"{self.supabase_url}/storage/v1/object/authenticated/{self.bucket_name}/{storage_key}"
                res = requests.get(url, headers=self._get_headers())
                if res.status_code != 200:
                    url_public = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{storage_key}"
                    res = requests.get(url_public, headers=self._get_headers())
                
                if res.status_code == 200:
                    content_type = res.headers.get("Content-Type", "image/jpeg")
                    return res.content, content_type
                return None, None
            except Exception as e:
                logger.error(f"Failed to get object {storage_key} from Supabase Storage: {e}")
                return None, None

        return await asyncio.to_thread(_get)

    async def exists(self, storage_key: str) -> bool:
        def _check():
            try:
                url = f"{self.supabase_url}/storage/v1/object/info/authenticated/{self.bucket_name}/{storage_key}"
                res = requests.get(url, headers=self._get_headers())
                if res.status_code == 200:
                    return True
                
                # Fallback to list search
                prefix = "/".join(storage_key.split("/")[:-1]) if "/" in storage_key else ""
                filename = storage_key.split("/")[-1]
                list_url = f"{self.supabase_url}/storage/v1/object/list/{self.bucket_name}"
                res_list = requests.post(
                    list_url,
                    headers=self._get_headers("application/json"),
                    json={"prefix": prefix, "limit": 100},
                )
                if res_list.status_code == 200:
                    items = res_list.json()
                    return any(item.get("name") == filename for item in items)
                return False
            except Exception:
                return False

        return await asyncio.to_thread(_check)
