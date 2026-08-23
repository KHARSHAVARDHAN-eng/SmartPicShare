import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, Index, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, SafeVector

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.photo import Photo


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    photo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("photos.id", ondelete="CASCADE"), index=True, nullable=False
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), index=True, nullable=False
    )
    embedding: Mapped[Any] = mapped_column(SafeVector(512), nullable=False)
    bounding_box: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    photo: Mapped["Photo"] = relationship("Photo", back_populates="face_embeddings")
    event: Mapped["Event"] = relationship("Event", back_populates="face_embeddings")


# Indexes
Index("idx_face_embeddings_event_id", FaceEmbedding.event_id)
Index("idx_face_embeddings_photo_id", FaceEmbedding.photo_id)
