import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from PIL import Image, ImageDraw
import io
import numpy as np
from app.services.face.insightface_engine import InsightFaceEngine


def create_human_like_face_image() -> bytes:
    # 400x400 image with face-like structure
    img = Image.new("RGB", (400, 400), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Head
    draw.ellipse([80, 60, 320, 340], fill=(240, 200, 160))
    # Hair
    draw.chord([75, 40, 325, 200], start=180, end=360, fill=(40, 25, 15))
    # Eyes
    draw.ellipse([140, 140, 175, 165], fill=(255, 255, 255))
    draw.ellipse([152, 147, 163, 158], fill=(30, 30, 30))
    draw.ellipse([225, 140, 260, 165], fill=(255, 255, 255))
    draw.ellipse([237, 147, 248, 158], fill=(30, 30, 30))
    # Eyebrows
    draw.line([135, 130, 180, 125], fill=(40, 25, 15), width=4)
    draw.line([220, 125, 265, 130], fill=(40, 25, 15), width=4)
    # Nose
    draw.polygon([(200, 165), (190, 220), (210, 220)], fill=(210, 160, 130))
    # Mouth & Lips
    draw.polygon([(160, 250), (200, 240), (240, 250), (200, 270)], fill=(180, 60, 60))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


async def verify():
    engine = InsightFaceEngine()
    img_bytes = create_human_like_face_image()
    bgr_arr = engine.decode_image_bytes(img_bytes)

    app = engine._get_insightface_app()
    assert app is not None, "InsightFace app should not be None"

    print("Running face detection on CPU...")
    faces = app.get(bgr_arr)
    print(f"Detected {len(faces)} face(s)")

    for i, face in enumerate(faces):
        print(f"Face {i+1} score: {face.det_score:.4f}, embedding shape: {face.embedding.shape}")
        assert face.embedding.shape[0] == 512, f"Embedding shape mismatch: {face.embedding.shape}"

    print("Real InsightFace ONNX CPU engine verification complete!")

if __name__ == "__main__":
    asyncio.run(verify())
