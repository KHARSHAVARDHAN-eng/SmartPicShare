from typing import Any, Dict, List
from app.core.logging import logger
from app.services.face.base import FaceRecognitionService


class StubFaceRecognitionService(FaceRecognitionService):
    """
    Isolated Stub Face Recognition Service module.
    Will be replaced by InsightFace ONNX implementation in Phase 3/4.
    """

    async def detect_faces(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        logger.info(f"Stub detect_faces called with {len(image_bytes)} bytes")
        return [{"x": 10, "y": 20, "w": 100, "h": 120, "confidence": 0.99}]

    async def generate_embeddings(
        self, image_bytes: bytes
    ) -> List[List[float]]:
        logger.info(f"Stub generate_embeddings called with {len(image_bytes)} bytes")
        # Return 512-dim mock vector
        mock_embedding = [0.01 * (i % 10) for i in range(512)]
        return [mock_embedding]

    async def process_photo(
        self, photo_id: str, image_bytes: bytes
    ) -> List[Dict[str, Any]]:
        logger.info(f"Stub process_photo called for photo_id={photo_id}")
        bbox = {"x": 10, "y": 20, "w": 100, "h": 120}
        mock_embedding = [0.01 * (i % 10) for i in range(512)]
        return [
            {
                "bounding_box": bbox,
                "embedding": mock_embedding,
            }
        ]
