import io
import math
import uuid
from typing import Any, Dict, List, Optional
import numpy as np
from PIL import Image
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.logging import logger
from app.models.face_embedding import FaceEmbedding
from app.models.photo import Photo
from app.services.face.base import FaceRecognitionService

try:
    import cv2
    import insightface
    from insightface.app import FaceAnalysis
    INSIGHTFACE_AVAILABLE = True
except ImportError:
    INSIGHTFACE_AVAILABLE = False


class InsightFaceEngine(FaceRecognitionService):
    """
    Production-grade InsightFace Real Face Recognition Engine.
    Uses SCRFD for face detection and ArcFace/MobileFaceNet for 512-dim embedding extraction.
    Runs on CPU with singleton model caching across requests.
    """

    _app: Optional[Any] = None
    _initialized: bool = False

    @classmethod
    def _get_insightface_app(cls) -> Optional[Any]:
        """
        Singleton lifecycle approach: Loads InsightFace models ONCE per backend process.
        """
        if not INSIGHTFACE_AVAILABLE:
            logger.warning("InsightFace library is not available in environment.")
            return None

        if cls._app is None and not cls._initialized:
            try:
                logger.info("Initializing InsightFace 'buffalo_s' CPU model pack...")
                app = FaceAnalysis(
                    name="buffalo_s",
                    providers=["CPUExecutionProvider"],
                )
                app.prepare(ctx_id=0, det_size=(640, 640))
                cls._app = app
                cls._initialized = True
                logger.info("InsightFace 'buffalo_s' CPU engine initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize InsightFace model pack: {str(e)}")
                cls._initialized = True
                cls._app = None

        return cls._app

    @staticmethod
    def decode_image_bytes(image_bytes: bytes) -> np.ndarray:
        """
        Validates and decodes raw image bytes (JPEG, PNG, WEBP) into a BGR numpy array for OpenCV/InsightFace.
        Handles corrupted or malformed image data safely.
        """
        if not image_bytes:
            raise AppException("Empty image payload provided", status_code=400)

        try:
            # 1. Validate with Pillow first to prevent buffer overflow attacks or corrupted headers
            pil_img = Image.open(io.BytesIO(image_bytes))
            pil_img.verify()

            # Re-open after verify() (Pillow requirement)
            pil_img = Image.open(io.BytesIO(image_bytes))
            pil_img = pil_img.convert("RGB")

            # 2. Convert PIL RGB Image to numpy BGR array
            rgb_arr = np.array(pil_img)
            bgr_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
            return bgr_arr
        except Exception as e:
            logger.error(f"Image decoding failed for payload of size {len(image_bytes)}: {str(e)}")
            raise AppException(f"Invalid or corrupted image format: {str(e)}", status_code=400)

    async def detect_faces(
        self, image_bytes: bytes, min_confidence: float = 0.50
    ) -> List[Dict[str, Any]]:
        bgr_arr = self.decode_image_bytes(image_bytes)
        app = self._get_insightface_app()

        if app is None:
            # Fallback mock for testing environment without downloaded ONNX weights
            return []

        faces = app.get(bgr_arr)
        results = []
        for face in faces:
            score = float(getattr(face, "det_score", 1.0))
            if score < min_confidence:
                continue

            bbox = face.bbox.astype(int).tolist()  # [x1, y1, x2, y2]
            x1, y1, x2, y2 = bbox
            w = max(0, x2 - x1)
            h = max(0, y2 - y1)

            results.append({
                "bounding_box": {"x": x1, "y": y1, "w": w, "h": h},
                "confidence": score,
            })

        return results

    async def generate_embeddings(
        self, image_bytes: bytes, min_confidence: float = 0.50
    ) -> List[List[float]]:
        bgr_arr = self.decode_image_bytes(image_bytes)
        app = self._get_insightface_app()

        if app is None:
            return []

        faces = app.get(bgr_arr)
        embeddings = []
        for face in faces:
            score = float(getattr(face, "det_score", 1.0))
            if score < min_confidence:
                continue

            embedding = face.embedding
            if embedding is not None:
                # Ensure float list format
                vec = embedding.tolist() if isinstance(embedding, np.ndarray) else list(embedding)
                assert len(vec) == 512, f"Expected 512-dim embedding, got {len(vec)}-dim"
                embeddings.append(vec)

        return embeddings

    async def process_photo(
        self, photo_id: uuid.UUID, event_id: uuid.UUID, image_bytes: bytes
    ) -> List[Dict[str, Any]]:
        bgr_arr = self.decode_image_bytes(image_bytes)
        app = self._get_insightface_app()

        if app is None:
            return []

        faces = app.get(bgr_arr)
        processed_faces = []
        for face in faces:
            score = float(getattr(face, "det_score", 1.0))
            if score < 0.50:
                continue

            bbox = face.bbox.astype(int).tolist()
            x1, y1, x2, y2 = bbox
            w = max(0, x2 - x1)
            h = max(0, y2 - y1)

            embedding = face.embedding
            if embedding is not None:
                vec = embedding.tolist() if isinstance(embedding, np.ndarray) else list(embedding)
                # L2 normalize vector
                norm = math.sqrt(sum(x * x for x in vec))
                if norm > 0:
                    vec = [x / norm for x in vec]

                assert len(vec) == 512, f"Embedding dimension mismatch: {len(vec)} != 512"

                processed_faces.append({
                    "bounding_box": {"x": x1, "y": y1, "w": w, "h": h},
                    "embedding": vec,
                    "confidence": score,
                })

        return processed_faces

    async def extract_selfie_embedding(
        self, image_bytes: bytes, min_confidence: float = 0.50
    ) -> Optional[List[float]]:
        """
        Processes a guest selfie image and returns the main face embedding (512-dim).
        """
        embeddings = await self.generate_embeddings(image_bytes, min_confidence=min_confidence)
        if not embeddings:
            return None
        return embeddings[0]

    async def find_matches(
        self,
        event_id: uuid.UUID,
        query_embedding: List[float],
        db: AsyncSession,
        threshold: float = 0.45,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Executes vector similarity search against PostgreSQL pgvector with strict event isolation.
        """
        if len(query_embedding) != 512:
            raise AppException(f"Invalid query embedding dimension: expected 512, got {len(query_embedding)}", status_code=400)

        # Check DB dialect
        bind = db.get_bind()
        if bind.dialect.name == "postgresql":
            # Native pgvector cosine similarity search
            # Cosine similarity = 1 - (embedding <=> query_embedding)
            query_str = """
                SELECT photo_id, MAX(1 - (embedding <=> :query_vec::vector)) AS similarity
                FROM face_embeddings
                WHERE event_id = :event_id
                  AND (1 - (embedding <=> :query_vec::vector)) >= :threshold
                GROUP BY photo_id
                ORDER BY similarity DESC
                LIMIT :limit
            """
            result = await db.execute(
                text(query_str),
                {
                    "event_id": str(event_id),
                    "query_vec": f"[{','.join(str(x) for x in query_embedding)}]",
                    "threshold": threshold,
                    "limit": limit,
                },
            )
            rows = result.all()
            return [{"photo_id": uuid.UUID(str(row[0])), "similarity": float(row[1])} for row in rows]
        else:
            # Fallback for SQLite in unit tests: Calculate cosine similarity in Python
            stmt = select(FaceEmbedding).where(FaceEmbedding.event_id == event_id)
            res = await db.execute(stmt)
            embeddings_records = res.scalars().all()

            matches = {}
            query_arr = np.array(query_embedding, dtype=np.float32)
            query_norm = np.linalg.norm(query_arr)

            if query_norm == 0:
                return []

            for rec in embeddings_records:
                emb_arr = np.array(rec.embedding, dtype=np.float32)
                emb_norm = np.linalg.norm(emb_arr)
                if emb_norm == 0:
                    continue

                sim = float(np.dot(query_arr, emb_arr) / (query_norm * emb_norm))
                if sim >= threshold:
                    pid = rec.photo_id
                    if pid not in matches or sim > matches[pid]:
                        matches[pid] = sim

            sorted_matches = sorted(matches.items(), key=lambda item: item[1], reverse=True)[:limit]
            return [{"photo_id": pid, "similarity": sim} for pid, sim in sorted_matches]
