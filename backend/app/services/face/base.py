import uuid
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession


class FaceRecognitionService(ABC):
    """
    Abstract Face Recognition Service Interface.
    Defines methods for face detection, 512-dim embedding extraction, photo processing,
    guest selfie extraction, and pgvector cosine similarity matching.
    """

    @abstractmethod
    async def detect_faces(
        self, image_bytes: bytes, min_confidence: float = 0.50
    ) -> List[Dict[str, Any]]:
        """
        Detects faces in image bytes and returns bounding boxes and landmarks.
        """
        pass

    @abstractmethod
    async def generate_embeddings(
        self, image_bytes: bytes, min_confidence: float = 0.50
    ) -> List[List[float]]:
        """
        Generates 512-dimensional vector embeddings for detected faces.
        """
        pass

    @abstractmethod
    async def process_photo(
        self, photo_id: uuid.UUID, event_id: uuid.UUID, image_bytes: bytes
    ) -> List[Dict[str, Any]]:
        """
        Processes a photo, extracting all faces and 512-dim embeddings.
        Returns list of dicts containing bounding_box, embedding, and confidence.
        """
        pass

    @abstractmethod
    async def extract_selfie_embedding(
        self, image_bytes: bytes, min_confidence: float = 0.50
    ) -> Optional[List[float]]:
        """
        Processes a single guest selfie image and returns its 512-dimensional embedding.
        Returns None if no valid face is detected.
        """
        pass

    @abstractmethod
    async def find_matches(
        self,
        event_id: uuid.UUID,
        query_embedding: List[float],
        db: AsyncSession,
        threshold: float = 0.45,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Executes vector similarity search for query_embedding against event_id embeddings.
        Enforces strict event isolation.
        Returns matching photo records with similarity scores.
        """
        pass
