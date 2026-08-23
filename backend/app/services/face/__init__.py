from app.services.face.base import FaceRecognitionService
from app.services.face.insightface_engine import InsightFaceEngine
from app.services.face.stub import StubFaceRecognitionService


def get_face_service() -> FaceRecognitionService:
    """
    Factory returning singleton InsightFaceEngine instance.
    """
    return InsightFaceEngine()


__all__ = [
    "FaceRecognitionService",
    "InsightFaceEngine",
    "StubFaceRecognitionService",
    "get_face_service",
]
