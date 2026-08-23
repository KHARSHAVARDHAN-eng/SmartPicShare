import uuid
from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_face, get_storage
from app.config import settings
from app.core.exceptions import AppException, ForbiddenError, LimitExceededError, NotFoundError
from app.db.session import get_db
from app.models.event import Event
from app.models.face_embedding import FaceEmbedding
from app.models.photo import Photo
from app.models.user import User
from app.schemas.photo import PhotoRead, PhotoUploadResponse
from app.services.face import FaceRecognitionService
from app.services.storage import StorageService

router = APIRouter(tags=["Photos"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


@router.post(
    "/events/{event_id}/photos",
    response_model=PhotoUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_photos(
    event_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
    face_service: FaceRecognitionService = Depends(get_face),
):
    """
    Uploads up to 150 photos to an event.
    Enforces server-side 150 photo limit and ownership checks.
    """
    # 1. Fetch event and check ownership
    stmt = select(Event).where(Event.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()

    if not event:
        raise NotFoundError("Event not found")

    if event.owner_id != current_user.id:
        raise ForbiddenError("You do not have permission to upload photos to this event")

    # 2. Count existing photos in event
    count_stmt = select(func.count(Photo.id)).where(Photo.event_id == event_id)
    count_result = await db.execute(count_stmt)
    existing_count = count_result.scalar() or 0

    # 3. Server-side validation of V1 150-photo limit
    new_photos_count = len(files)
    if existing_count + new_photos_count > settings.MAX_PHOTOS_PER_EVENT:
        raise LimitExceededError(
            f"Event photo limit exceeded. Existing photos: {existing_count}, "
            f"Attempting to upload: {new_photos_count}, Maximum allowed: {settings.MAX_PHOTOS_PER_EVENT}"
        )

    uploaded_photos: List[PhotoRead] = []

    # 4. Process each uploaded file
    for file in files:
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise AppException(
                f"Unsupported file type '{file.content_type}'. Allowed types: JPEG, PNG, WEBP",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE_BYTES:
            raise AppException(
                f"File '{file.filename}' exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        photo_uuid = uuid.uuid4()
        storage_key = f"events/{event_id}/original/{photo_uuid}.jpg"

        # Upload to Cloudflare R2 / Mock Storage
        await storage.upload(
            file_bytes=content,
            storage_key=storage_key,
            content_type=file.content_type,
        )

        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)

        # Create photo record in database
        photo = Photo(
            id=photo_uuid,
            event_id=event_id,
            storage_key=storage_key,
            original_filename=file.filename or f"{photo_uuid}.jpg",
            content_type=file.content_type,
            file_size=len(content),
            processing_status="PROCESSED",
            created_at=now,
        )

        db.add(photo)

        # Asynchronous/Stub face processing integration
        face_results = await face_service.process_photo(str(photo_uuid), content)
        for face_data in face_results:
            embedding_record = FaceEmbedding(
                photo_id=photo_uuid,
                event_id=event_id,
                embedding=face_data["embedding"],
                bounding_box=face_data["bounding_box"],
            )
            db.add(embedding_record)

        signed_url = await storage.generate_signed_url(storage_key)
        photo_read = PhotoRead.model_validate(photo)
        photo_read.public_url = signed_url
        uploaded_photos.append(photo_read)

    await db.commit()

    return PhotoUploadResponse(
        message=f"Successfully uploaded {len(uploaded_photos)} photos",
        uploaded_photos=uploaded_photos,
    )


@router.get("/events/{event_id}/photos", response_model=List[PhotoRead])
async def list_event_photos(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
):
    """Lists photos for a specific event."""
    stmt = select(Event).where(Event.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()

    if not event:
        raise NotFoundError("Event not found")

    if event.owner_id != current_user.id:
        raise ForbiddenError("You do not have permission to view photos for this event")

    photos_stmt = (
        select(Photo).where(Photo.event_id == event_id).order_by(Photo.created_at.desc())
    )
    photos_result = await db.execute(photos_stmt)
    photos = photos_result.scalars().all()

    photo_list = []
    for photo in photos:
        photo_read = PhotoRead.model_validate(photo)
        photo_read.public_url = await storage.generate_signed_url(photo.storage_key)
        photo_list.append(photo_read)

    return photo_list


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
):
    """Deletes a photo by ID."""
    stmt = select(Photo).join(Event, Photo.event_id == Event.id).where(Photo.id == photo_id)
    result = await db.execute(stmt)
    photo = result.scalar_one_or_none()

    if not photo:
        raise NotFoundError("Photo not found")

    # Fetch parent event to verify ownership
    event_stmt = select(Event).where(Event.id == photo.event_id)
    event_result = await db.execute(event_stmt)
    event = event_result.scalar_one_or_none()

    if not event or event.owner_id != current_user.id:
        raise ForbiddenError("You do not have permission to delete this photo")

    # Delete from Object Storage
    await storage.delete(photo.storage_key)

    # Delete from Postgres DB
    await db.delete(photo)
    await db.commit()
    return None
