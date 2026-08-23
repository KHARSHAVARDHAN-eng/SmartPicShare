"""Initial database schema for users, events, photos, face_embeddings

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-23 23:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if vector extension exists on PostgreSQL
    has_vector_ext = False
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        try:
            res = conn.execute(sa.text("SELECT 1 FROM pg_extension WHERE extname = 'vector'"))
            has_vector_ext = res.scalar() is not None
        except Exception:
            has_vector_ext = False

    # 1. Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.String(length=1024), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_users_email', 'users', ['email'])

    # 2. Events table
    op.create_table(
        'events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False, unique=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='CREATED'),
        sa.Column('max_photos', sa.Integer(), nullable=False, server_default='150'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_events_owner_id', 'events', ['owner_id'])
    op.create_index('idx_events_slug', 'events', ['slug'])

    # 3. Photos table
    op.create_table(
        'photos',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('storage_key', sa.String(length=512), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('processing_status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_photos_event_id', 'photos', ['event_id'])

    # 4. Face Embeddings table (512-dim vector or JSON fallback)
    embedding_col_type = pgvector.sqlalchemy.Vector(512) if has_vector_ext else sa.JSON()

    op.create_table(
        'face_embeddings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('photo_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('photos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('embedding', embedding_col_type, nullable=False),
        sa.Column('bounding_box', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_face_embeddings_event_id', 'face_embeddings', ['event_id'])
    op.create_index('idx_face_embeddings_photo_id', 'face_embeddings', ['photo_id'])


def downgrade() -> None:
    op.drop_table('face_embeddings')
    op.drop_table('photos')
    op.drop_table('events')
    op.drop_table('users')
