from app.services.face.base import FaceRecognitionService
from app.services.face.stub import StubFaceRecognitionService


def get_face_service() -> FaceRecognitionService:
    return StubFaceRecognitionService()


__all__ = [
    "FaceRecognitionService",
    "StubFaceRecognitionService",
    "get_face_service",
]
