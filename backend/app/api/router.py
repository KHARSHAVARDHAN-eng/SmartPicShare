from fastapi import APIRouter
from app.api.v1 import events, health, photos

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(events.router, prefix="/api/v1")
api_router.include_router(photos.router, prefix="/api/v1")
