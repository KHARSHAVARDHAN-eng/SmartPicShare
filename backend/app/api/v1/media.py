from fastapi import APIRouter, Depends, Response
from app.api.dependencies import get_storage
from app.core.exceptions import NotFoundError
from app.services.storage import StorageService

router = APIRouter(tags=["Media"])


@router.get("/media/{storage_key:path}")
async def get_media_file(
    storage_key: str,
    storage: StorageService = Depends(get_storage),
):
    """
    Serves stored media image files directly for local/mock storage mode
    with high-performance browser caching headers.
    """
    if hasattr(storage, "get_file"):
        file_bytes, content_type = await storage.get_file(storage_key)
        if file_bytes is not None:
            return Response(
                content=file_bytes,
                media_type=content_type or "image/jpeg",
                headers={
                    "Cache-Control": "public, max-age=86400, immutable",
                    "Access-Control-Allow-Origin": "*",
                },
            )

    raise NotFoundError("Media file not found")
