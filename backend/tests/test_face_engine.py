import io
import uuid
import numpy as np
import pytest
from PIL import Image, ImageDraw
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models import Event, FaceEmbedding, Photo, User
from app.services.face.base import FaceRecognitionService
from app.services.face.insightface_engine import InsightFaceEngine


def create_synthetic_test_image(num_faces: int = 1) -> bytes:
    """
    Generates synthetic RGB image bytes containing drawn test face shapes.
    """
    img = Image.new("RGB", (400, 400), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)

    for i in range(num_faces):
        center_x = 100 + i * 150
        center_y = 150
        # Draw face oval
        draw.ellipse([center_x - 40, center_y - 50, center_x + 40, center_y + 50], fill=(220, 180, 150))
        # Draw eyes
        draw.ellipse([center_x - 20, center_y - 15, center_x - 10, center_y - 5], fill=(40, 40, 40))
        draw.ellipse([center_x + 10, center_y - 15, center_x + 20, center_y - 5], fill=(40, 40, 40))
        # Draw mouth
        draw.arc([center_x - 15, center_y + 10, center_x + 15, center_y + 25], start=0, end=180, fill=(180, 40, 40))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


class MockFaceRecognitionService(InsightFaceEngine):
    """
    Test mock extension of InsightFaceEngine for offline Pytest execution.
    Generates deterministic 512-dimensional embeddings and bounding boxes.
    """

    async def detect_faces(self, image_bytes: bytes, min_confidence: float = 0.50):
        # Validate decodable image
        self.decode_image_bytes(image_bytes)
        # Determine number of faces from image width heuristic or synthetic signature
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size

        if width < 100:  # Invalid/empty image test
            return []

        # Default synthetic face detection
        if len(image_bytes) % 2 == 0:
            return [{
                "bounding_box": {"x": 50, "y": 50, "w": 80, "h": 100},
                "confidence": 0.95,
            }]
        else:
            return [
                {"bounding_box": {"x": 50, "y": 50, "w": 80, "h": 100}, "confidence": 0.95},
                {"bounding_box": {"x": 200, "y": 50, "w": 80, "h": 100}, "confidence": 0.92},
            ]

    async def generate_embeddings(self, image_bytes: bytes, min_confidence: float = 0.50):
        faces = await self.detect_faces(image_bytes, min_confidence=min_confidence)
        embeddings = []
        for i, face in enumerate(faces):
            # Generate deterministic 512-dim unit vector
            vec = [0.0] * 512
            vec[i % 512] = 1.0
            embeddings.append(vec)
        return embeddings

    async def process_photo(self, photo_id: uuid.UUID, event_id: uuid.UUID, image_bytes: bytes):
        faces = await self.detect_faces(image_bytes)
        results = []
        for i, face in enumerate(faces):
            vec = [0.0] * 512
            vec[i % 512] = 1.0
            results.append({
                "bounding_box": face["bounding_box"],
                "embedding": vec,
                "confidence": face["confidence"],
            })
        return results


@pytest.mark.asyncio
async def test_image_decoding_valid():
    engine = InsightFaceEngine()
    img_bytes = create_synthetic_test_image(num_faces=1)
    bgr_arr = engine.decode_image_bytes(img_bytes)
    assert isinstance(bgr_arr, np.ndarray)
    assert bgr_arr.shape[2] == 3


@pytest.mark.asyncio
async def test_image_decoding_corrupted():
    engine = InsightFaceEngine()
    corrupt_bytes = b"NOT_AN_IMAGE_PAYLOAD_DATA"
    with pytest.raises(AppException) as exc_info:
        engine.decode_image_bytes(corrupt_bytes)
    assert exc_info.value.status_code == 400
    assert "Invalid or corrupted image format" in exc_info.value.message


@pytest.mark.asyncio
async def test_embedding_dimension_verification():
    service = MockFaceRecognitionService()
    img_bytes = create_synthetic_test_image(num_faces=1)
    embeddings = await service.generate_embeddings(img_bytes)
    assert len(embeddings) > 0
    for vec in embeddings:
        assert len(vec) == 512, f"Embedding vector must be 512 dimensions, got {len(vec)}"


@pytest.mark.asyncio
async def test_bounding_box_persistence(setup_test_db):
    from tests.conftest import TestingSessionLocal

    service = MockFaceRecognitionService()
    img_bytes = create_synthetic_test_image(num_faces=1)

    async with TestingSessionLocal() as db:
        user_id = uuid.uuid4()
        user = User(id=user_id, email="face_test@example.com")
        event = Event(owner_id=user_id, name="Face Gala", slug="face-gala-1")
        db.add_all([user, event])
        await db.flush()

        photo = Photo(
            event_id=event.id,
            storage_key="test/key.jpg",
            original_filename="test.jpg",
            content_type="image/jpeg",
            file_size=500,
            processing_status="PENDING",
        )
        db.add(photo)
        await db.flush()

        results = await service.process_photo(photo.id, event.id, img_bytes)
        assert len(results) >= 1

        for r in results:
            emb_record = FaceEmbedding(
                photo_id=photo.id,
                event_id=event.id,
                embedding=r["embedding"],
                bounding_box=r["bounding_box"],
            )
            db.add(emb_record)

        photo.processing_status = "PROCESSED"
        await db.commit()

        # Verify DB records
        res = await db.execute(select(FaceEmbedding).where(FaceEmbedding.photo_id == photo.id))
        records = res.scalars().all()
        assert len(records) == len(results)
        assert records[0].bounding_box == {"x": 50, "y": 50, "w": 80, "h": 100}
        assert len(records[0].embedding) == 512


@pytest.mark.asyncio
async def test_vector_similarity_search_and_event_isolation(setup_test_db):
    from tests.conftest import TestingSessionLocal

    service = MockFaceRecognitionService()

    async with TestingSessionLocal() as db:
        user_id = uuid.uuid4()
        user = User(id=user_id, email="isolation@example.com")

        event_a = Event(owner_id=user_id, name="Event A", slug="event-a-iso")
        event_b = Event(owner_id=user_id, name="Event B", slug="event-b-iso")
        db.add_all([user, event_a, event_b])
        await db.flush()

        photo_a = Photo(
            event_id=event_a.id,
            storage_key="test/a.jpg",
            original_filename="a.jpg",
            content_type="image/jpeg",
            file_size=500,
        )
        photo_b = Photo(
            event_id=event_b.id,
            storage_key="test/b.jpg",
            original_filename="b.jpg",
            content_type="image/jpeg",
            file_size=500,
        )
        db.add_all([photo_a, photo_b])
        await db.flush()

        # Shared query embedding vector
        target_embedding = [0.0] * 512
        target_embedding[0] = 1.0  # Unit vector

        # Insert embedding in Event A
        emb_a = FaceEmbedding(
            photo_id=photo_a.id,
            event_id=event_a.id,
            embedding=target_embedding,
            bounding_box={"x": 0, "y": 0, "w": 100, "h": 100},
        )
        # Insert same embedding in Event B
        emb_b = FaceEmbedding(
            photo_id=photo_b.id,
            event_id=event_b.id,
            embedding=target_embedding,
            bounding_box={"x": 0, "y": 0, "w": 100, "h": 100},
        )
        db.add_all([emb_a, emb_b])
        await db.commit()

        # 1. Search Event A -> MUST return photo_a and MUST NOT return photo_b
        matches_a = await service.find_matches(
            event_id=event_a.id,
            query_embedding=target_embedding,
            db=db,
            threshold=0.80,
        )
        assert len(matches_a) == 1
        assert matches_a[0]["photo_id"] == photo_a.id
        assert matches_a[0]["similarity"] >= 0.99

        # 2. Search Event B -> MUST return photo_b and MUST NOT return photo_a
        matches_b = await service.find_matches(
            event_id=event_b.id,
            query_embedding=target_embedding,
            db=db,
            threshold=0.80,
        )
        assert len(matches_b) == 1
        assert matches_b[0]["photo_id"] == photo_b.id
        assert matches_b[0]["similarity"] >= 0.99
