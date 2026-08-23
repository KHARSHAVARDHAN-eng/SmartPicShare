import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_face, get_storage
from app.config import settings
from app.core.exceptions import AppException, NotFoundError
from app.db.session import get_db
from app.models.event import Event
from app.models.photo import Photo
from app.models.user import User
from app.services.face import FaceRecognitionService
from app.services.storage import StorageService

router = APIRouter(prefix="/events", tags=["Guest Matching"])

ALLOWED_SELFIE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


class PhotoMatchResult(BaseModel):
    photo_id: uuid.UUID
    original_filename: str
    url: str
    similarity: float


class GuestMatchResponse(BaseModel):
    event_id: uuid.UUID
    match_count: int
    threshold: float
    matches: List[PhotoMatchResult]


@router.post(
    "/{event_id}/match",
    response_model=GuestMatchResponse,
    status_code=status.HTTP_200_OK,
)
async def match_guest_selfie(
    event_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
    face_service: FaceRecognitionService = Depends(get_face),
):
    """
    Guest face-matching endpoint.
    Accepts one guest selfie image, extracts 512-dim embedding, and performs event-scoped pgvector cosine search.
    Enforces strict event isolation and single-face selfie rules. Discards raw selfie file after processing.
    """
    # 1. Verify event existence
    stmt = select(Event).where(Event.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()

    if not event:
        raise NotFoundError("Event not found")

    # 2. Validate file format & size
    if file.content_type not in ALLOWED_SELFIE_TYPES:
        raise AppException(
            f"Unsupported selfie type '{file.content_type}'. Allowed formats: JPEG, PNG, WEBP",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    selfie_bytes = await file.read()
    if len(selfie_bytes) > settings.MAX_SELFIE_SIZE_BYTES:
        raise AppException(
            f"Selfie file size exceeds maximum limit of {settings.MAX_SELFIE_SIZE_BYTES // (1024 * 1024)}MB",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # 3. Validate image decodability
    try:
        face_service.decode_image_bytes(selfie_bytes)
    except AppException:
        raise
    except Exception as e:
        raise AppException(f"Invalid or corrupted selfie image: {str(e)}", status_code=400)

    # 4. Detect faces and enforce V1 selfie rules
    faces = await face_service.detect_faces(selfie_bytes, min_confidence=0.50)
    if len(faces) == 0:
        raise AppException(
            "We couldn't detect a face in your selfie. Please try another photo with good lighting.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if len(faces) > 1:
        raise AppException(
            "Multiple faces detected. Please upload a selfie with only your face visible.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # 5. Extract 512-dimensional guest face embedding
    embeddings = await face_service.generate_embeddings(selfie_bytes, min_confidence=0.50)
    if not embeddings or len(embeddings[0]) != 512:
        raise AppException(
            "We couldn't generate a clear facial embedding. Please try another selfie.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    query_embedding = embeddings[0]

    # 6. Execute event-scoped vector similarity search (pgvector Cosine Distance)
    raw_matches = await face_service.find_matches(
        event_id=event_id,
        query_embedding=query_embedding,
        db=db,
        threshold=settings.FACE_MATCH_THRESHOLD,
        limit=150,
    )

    # 7. Fetch matching photo metadata and generate temporary signed URLs
    photo_matches: List[PhotoMatchResult] = []
    for match_info in raw_matches:
        pid = match_info["photo_id"]
        sim = match_info["similarity"]

        photo_stmt = select(Photo).where(Photo.id == pid, Photo.event_id == event_id)
        photo_res = await db.execute(photo_stmt)
        photo = photo_res.scalar_one_or_none()

        if photo:
            signed_url = await storage.generate_signed_url(photo.storage_key)
            photo_matches.append(
                PhotoMatchResult(
                    photo_id=photo.id,
                    original_filename=photo.original_filename,
                    url=signed_url,
                    similarity=round(sim, 4),
                )
            )

    # Sort descending by similarity
    photo_matches.sort(key=lambda x: x.similarity, reverse=True)

    return GuestMatchResponse(
        event_id=event_id,
        match_count=len(photo_matches),
        threshold=settings.FACE_MATCH_THRESHOLD,
        matches=photo_matches,
    )
