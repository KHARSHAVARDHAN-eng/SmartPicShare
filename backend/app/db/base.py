from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator, JSON
from pgvector.sqlalchemy import Vector as PGVector


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.
    """
    pass


class SafeVector(TypeDecorator):
    """
    Cross-compatible Vector type decorator.
    Uses pgvector's Vector(dim) on PostgreSQL dialects,
    and falls back to JSON representation on SQLite or other non-Postgres DBs.
    """
    impl = JSON
    cache_ok = True

    def __init__(self, dim: int = 512):
        self.dim = dim
        super().__init__()

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PGVector(self.dim))
        return dialect.type_descriptor(JSON())
