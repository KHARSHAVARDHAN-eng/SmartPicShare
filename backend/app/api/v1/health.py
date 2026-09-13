from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.db.session import get_db

router = APIRouter()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint for Render/hosting health probes and cold start pings.
    Checks database connection responsiveness.
    """
    db_status = "healthy"
    db_error = None
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "unhealthy"
        db_error = str(e)

    async_info = {}
    try:
        u = make_url(settings.DATABASE_URL)
        async_info = {
            "driver": u.drivername,
            "username": u.username,
            "hostname": u.host,
            "port": u.port,
            "database": u.database,
        }
    except Exception as parse_err:
        async_info = {"parse_error": str(parse_err)}

    sync_info = {}
    try:
        su = make_url(settings.SYNC_DATABASE_URL)
        sync_info = {
            "driver": su.drivername,
            "username": su.username,
            "hostname": su.host,
            "port": su.port,
            "database": su.database,
        }
    except Exception as parse_err:
        sync_info = {"parse_error": str(parse_err)}

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "db_error": db_error,
        "database_url_info": async_info,
        "sync_database_url_info": sync_info,
    }
