from __future__ import annotations

from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin
from app.models.database import Base

# Embedding dimensions of the models used
# all-MiniLM-L6-v2  -> 384-dim sentence embeddings
# clip-ViT-B-32     -> 512-dim image embeddings
TEXT_EMBEDDING_DIM = 384
IMAGE_EMBEDDING_DIM = 512


class PostEmbedding(Base, TimestampMixin):
    """Stores the AI embeddings for a single lost_found post.

    One row per post. text_embedding is always present (title + body + location),
    image_embedding is present only when the post has an image.
    """

    __tablename__ = "post_embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    post_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    item_state: Mapped[str] = mapped_column(String(10), nullable=False, index=True)

    text_embedding: Mapped[list[float] | None] = mapped_column(
        Vector(TEXT_EMBEDDING_DIM), nullable=True
    )
    image_embedding: Mapped[list[float] | None] = mapped_column(
        Vector(IMAGE_EMBEDDING_DIM), nullable=True
    )

    # Bookkeeping so the scheduler can skip already-processed posts
    embedding_model_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    embedding_model_image: Mapped[str | None] = mapped_column(String(100), nullable=True)

    post = relationship("Post", backref="embedding")


class MatchRecord(Base, TimestampMixin):
    """A candidate match between a 'lost' post and a 'found' post.
    """

    __tablename__ = "match_records"

    STATUS_PENDING_USER = "pending_user"
    STATUS_USER_CONFIRMED = "user_confirmed"
    STATUS_USER_REJECTED = "user_rejected"
    STATUS_MOD_CONFIRMED = "moderator_confirmed"
    STATUS_MOD_REJECTED = "moderator_rejected"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lost_post_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    found_post_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Similarity scores (0-1). Image score is null when either post lacks an image.
    text_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    image_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    combined_score: Mapped[float] = mapped_column(Float, nullable=False)

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=STATUS_PENDING_USER, index=True
    )

    # User review step
    user_reviewed_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    user_reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Moderator final confirmation step
    moderator_reviewed_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    moderator_reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    moderator_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Whether notifications for this match were already sent (idempotency)
    notified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    lost_post = relationship("Post", foreign_keys=[lost_post_id])
    found_post = relationship("Post", foreign_keys=[found_post_id])

    __table_args__ = (
        # Never store the same lost/found pair twice
        UniqueConstraint("lost_post_id", "found_post_id", name="uq_match_lost_found"),
        Index("ix_match_status_score", "status", "combined_score"),
    )


class Notification(Base, TimestampMixin):
    """In-app notification for a user.
    Delivered live over WebSocket when the user is connected and always
    persisted here so it shows up in the notification list.
    """

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # e.g. "match_found", "match_user_confirmed", "match_moderator_confirmed"
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    match_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("match_records.id", ondelete="CASCADE"), nullable=True
    )
    post_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True
    )

    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user = relationship("User", backref="notifications")
    match = relationship("MatchRecord", backref="notifications")

    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
    )
