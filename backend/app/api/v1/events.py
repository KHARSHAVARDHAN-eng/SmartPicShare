import secrets
import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.session import get_db
from app.models.event import Event
from app.models.photo import Photo
from app.models.user import User
from app.schemas.event import EventCreate, EventRead

router = APIRouter(prefix="/events", tags=["Events"])


def generate_event_slug(name: str) -> str:
    """Generates a URL-friendly slug with random hex suffix."""
    clean_name = "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-")
    clean_name = "-".join(filter(None, clean_name.split("-")))[:30]
    random_suffix = secrets.token_hex(4)
    return f"{clean_name}-{random_suffix}" if clean_name else f"event-{random_suffix}"


@router.get("", response_model=List[EventRead])
async def list_user_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all events created by the authenticated owner."""
    stmt = (
        select(Event, func.count(Photo.id).label("photo_count"))
        .outerjoin(Photo, Event.id == Photo.event_id)
        .where(Event.owner_id == current_user.id)
        .group_by(Event.id)
        .order_by(Event.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    events_response = []
    for event, photo_count in rows:
        event_dict = EventRead.model_validate(event).model_dump()
        event_dict["photo_count"] = photo_count
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
    return EventRead(**event_dict)


@router.get("/{event_id}", response_model=EventRead)
async def get_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gets details of an event by ID."""
    stmt = (
        select(Event, func.count(Photo.id).label("photo_count"))
        .outerjoin(Photo, Event.id == Photo.event_id)
        .where(Event.id == event_id)
        .group_by(Event.id)
    )
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise NotFoundError("Event not found")

    event, photo_count = row

    if event.owner_id != current_user.id:
        raise ForbiddenError("You do not have permission to view this event")

    event_dict = EventRead.model_validate(event).model_dump()
    event_dict["photo_count"] = photo_count
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
