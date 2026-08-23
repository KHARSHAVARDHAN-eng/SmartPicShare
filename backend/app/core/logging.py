import logging
import sys
from app.config import settings


def setup_logging() -> logging.Logger:
    """
    Configures structured logging for the FastAPI application.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    logger = logging.getLogger("smartsharephoto")
    logger.setLevel(log_level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(log_level)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


logger = setup_logging()
