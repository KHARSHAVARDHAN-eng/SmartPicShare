from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator, JSON


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.
    """
    pass


class SafeVector(TypeDecorator):
    """
    Cross-compatible Vector type decorator.
    Handles vector columns stored either as pgvector or as JSON arrays in PostgreSQL / SQLite,
    and safely converts results returned by DB drivers into Python lists of floats.
    """
    impl = JSON
    cache_ok = True

    def __init__(self, dim: int = 512):
        self.dim = dim
        super().__init__()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            cleaned = value.strip('[]')
            if not cleaned:
                return []
            return [float(x) for x in cleaned.split(',')]
        if hasattr(value, 'to_list'):
            return value.to_list()
        if hasattr(value, 'tolist'):
            return value.tolist()
        return list(value)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if hasattr(value, 'tolist'):
            value = value.tolist()
        return value
