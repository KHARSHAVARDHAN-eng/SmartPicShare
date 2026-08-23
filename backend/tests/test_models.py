import uuid
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import User, Event, Photo, FaceEmbedding


@pytest.mark.asyncio
async def test_orm_models_relationship(setup_test_db):
    from tests.conftest import TestingSessionLocal

    async with TestingSessionLocal() as db:
        user_id = uuid.uuid4()
        user = User(
            id=user_id,
            email="model_test@example.com",
            full_name="Model Tester",
        )
        db.add(user)

        event = Event(
            owner_id=user_id,
            name="Model Gala",
            slug="model-gala-1234",
        )
        db.add(event)
        await db.flush()

        photo = Photo(
            event_id=event.id,
            storage_key=f"events/{event.id}/photo.jpg",
            original_filename="photo.jpg",
            content_type="image/jpeg",
            file_size=1024,
        )
        db.add(photo)
        await db.flush()

        mock_embedding = [0.1] * 512
        face = FaceEmbedding(
            photo_id=photo.id,
            event_id=event.id,
            embedding=mock_embedding,
            bounding_box={"x": 0, "y": 0, "w": 50, "h": 50},
        )
        db.add(face)
        await db.commit()

        # Query user with eagerly loaded relationships
        stmt = (
            select(User)
            .options(
                selectinload(User.events)
                .selectinload(Event.photos)
                .selectinload(Photo.face_embeddings)
            )
            .where(User.id == user_id)
        )
        res = await db.execute(stmt)
        queried_user = res.scalar_one()

        assert queried_user.email == "model_test@example.com"
        assert len(queried_user.events) == 1
        assert queried_user.events[0].name == "Model Gala"
        assert len(queried_user.events[0].photos) == 1
        assert len(queried_user.events[0].photos[0].face_embeddings) == 1
