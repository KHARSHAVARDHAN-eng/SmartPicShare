import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class EventBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = None


class EventRead(EventBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    slug: str
    status: str
    max_photos: int
    photo_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
