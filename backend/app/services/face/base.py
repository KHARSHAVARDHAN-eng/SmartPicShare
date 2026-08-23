from abc import ABC, abstractmethod
from typing import Any, Dict, List


class FaceRecognitionService(ABC):
    """
    Abstract Face Recognition Service Interface.
    Defines methods for face detection, embedding extraction, and photo processing.
    """

    @abstractmethod
    async def detect_faces(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Detects faces in an image and returns bounding box coordinates.
        """
        pass

    @abstractmethod
    async def generate_embeddings(
        self, image_bytes: bytes
    ) -> List[List[float]]:
        """
        Generates 512-dimensional vector embeddings for faces in an image.
        """
        pass

    @abstractmethod
    async def process_photo(
        self, photo_id: str, image_bytes: bytes
    ) -> List[Dict[str, Any]]:
        """
        Processes a photo, extracting faces & embeddings for indexing.
        """
        pass
