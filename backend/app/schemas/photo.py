import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class PhotoBase(BaseModel):
    original_filename: str
    content_type: str
    file_size: int


class PhotoRead(PhotoBase):
    id: uuid.UUID
    event_id: uuid.UUID
    storage_key: str
    public_url: Optional[str] = None
    processing_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PhotoUploadResponse(BaseModel):
    message: str
    uploaded_photos: List[PhotoRead]
