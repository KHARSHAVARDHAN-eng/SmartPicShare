import secrets
import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_storage
from app.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.session import get_db
from app.models.event import Event
from app.models.photo import Photo
from app.models.user import User
from app.schemas.event import EventCreate, EventRead, PublicEventRead
from app.services.storage import StorageService

router = APIRouter(prefix="/events", tags=["Events"])


def generate_event_slug(name: str) -> str:
    """Generates a URL-friendly slug with random hex suffix."""
    clean_name = "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-")
    clean_name = "-".join(filter(None, clean_name.split("-")))[:30]
    random_suffix = secrets.token_hex(4)
    return f"{clean_name}-{random_suffix}" if clean_name else f"event-{random_suffix}"


def build_event_metrics_query():
    """Helper constructing SQL select query for event with aggregated photo status counts."""
    processed_expr = func.sum(case((Photo.processing_status == "PROCESSED", 1), else_=0))
    pending_expr = func.sum(case((Photo.processing_status == "PENDING", 1), else_=0))
    failed_expr = func.sum(case((Photo.processing_status == "FAILED", 1), else_=0))

    return (
        select(
            Event,
            func.count(Photo.id).label("photo_count"),
            func.coalesce(processed_expr, 0).label("processed_count"),
            func.coalesce(pending_expr, 0).label("pending_count"),
            func.coalesce(failed_expr, 0).label("failed_count"),
        )
        .outerjoin(Photo, Event.id == Photo.event_id)
        .group_by(Event.id)
    )


@router.get("", response_model=List[EventRead])
async def list_user_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
):
    """Lists all events created by the authenticated owner with cover photo URLs."""
    stmt = (
        build_event_metrics_query()
        .where(Event.owner_id == current_user.id)
        .order_by(Event.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    events_response = []
    for event, photo_count, processed_count, pending_count, failed_count in rows:
        event_dict = EventRead.model_validate(event).model_dump()
        event_dict["photo_count"] = photo_count
        event_dict["processed_count"] = processed_count
        event_dict["pending_count"] = pending_count
        event_dict["failed_count"] = failed_count
        event_dict["is_ready"] = photo_count > 0 and pending_count == 0

        if photo_count > 0:
            latest_photo_stmt = (
                select(Photo.storage_key)
                .where(Photo.event_id == event.id)
                .order_by(Photo.created_at.desc())
                .limit(1)
            )
            latest_res = await db.execute(latest_photo_stmt)
            latest_key = latest_res.scalar_one_or_none()
            if latest_key:
                event_dict["cover_photo_url"] = await storage.generate_signed_url(latest_key)

        events_response.append(EventRead(**event_dict))

    return events_response


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new photo-sharing event owned by the authenticated user."""
    slug = generate_event_slug(event_in.name)

    event = Event(
        owner_id=current_user.id,
        name=event_in.name,
        slug=slug,
        status="CREATED",
        max_photos=settings.MAX_PHOTOS_PER_EVENT,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    event_dict = EventRead.model_validate(event).model_dump()
    event_dict["photo_count"] = 0
    event_dict["processed_count"] = 0
    event_dict["pending_count"] = 0
    event_dict["failed_count"] = 0
    event_dict["is_ready"] = False
    return EventRead(**event_dict)


@router.get("/public/{slug}", response_model=PublicEventRead)
async def get_public_event(
    slug: str,
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
):
    """Public unauthenticated event lookup for guest landing page /event/{slug}."""
    stmt = build_event_metrics_query().where(Event.slug == slug)
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise NotFoundError("Event not found")

    event, photo_count, processed_count, pending_count, failed_count = row

    cover_photo_url = None
    if photo_count > 0:
        latest_photo_stmt = (
            select(Photo.storage_key)
            .where(Photo.event_id == event.id)
            .order_by(Photo.created_at.desc())
            .limit(1)
        )
        latest_res = await db.execute(latest_photo_stmt)
        latest_key = latest_res.scalar_one_or_none()
        if latest_key:
            cover_photo_url = await storage.generate_signed_url(latest_key)

    return PublicEventRead(
        id=event.id,
        name=event.name,
        slug=event.slug,
        status=event.status,
        photo_count=photo_count,
        processed_count=processed_count,
        is_ready=photo_count > 0 and pending_count == 0,
        cover_photo_url=cover_photo_url,
        created_at=event.created_at,
    )



@router.get("/{event_id}", response_model=EventRead)
async def get_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
):
    """Gets detailed metrics of an event by ID."""
    stmt = build_event_metrics_query().where(Event.id == event_id)
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise NotFoundError("Event not found")

    event, photo_count, processed_count, pending_count, failed_count = row

    if event.owner_id != current_user.id:
        raise ForbiddenError("You do not have permission to view this event")

    event_dict = EventRead.model_validate(event).model_dump()
    event_dict["photo_count"] = photo_count
    event_dict["processed_count"] = processed_count
    event_dict["pending_count"] = pending_count
    event_dict["failed_count"] = failed_count
    event_dict["is_ready"] = photo_count > 0 and pending_count == 0

    if photo_count > 0:
        latest_photo_stmt = (
            select(Photo.storage_key)
            .where(Photo.event_id == event.id)
            .order_by(Photo.created_at.desc())
            .limit(1)
        )
        latest_res = await db.execute(latest_photo_stmt)
        latest_key = latest_res.scalar_one_or_none()
        if latest_key:
            event_dict["cover_photo_url"] = await storage.generate_signed_url(latest_key)

    return EventRead(**event_dict)



@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes an event and all associated photos and embeddings."""
    stmt = select(Event).where(Event.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()

    if not event:
        raise NotFoundError("Event not found")

    if event.owner_id != current_user.id:
        raise ForbiddenError("You do not have permission to delete this event")

    await db.delete(event)
    await db.commit()
    return None
