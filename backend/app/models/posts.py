from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text, JSON, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin
from app.models.database import Base


class Post(Base,TimestampMixin):
    """ A post inside a community. """

    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    #foreign keys
    community_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    post_type: Mapped[str] = mapped_column(String(30), nullable=False,index=True)
    status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    item_state: Mapped[str | None] = mapped_column(String(10), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)     # lost_found location# lost_found
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    file_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    file_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Verification Fields
    is_teacher_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    extra_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Relationships
    user = relationship(
    "User",
    back_populates="post_entries",
    foreign_keys=[user_id]
)
    community = relationship("Community", back_populates="posts")
    reactions = relationship("PostReaction", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")
    verifications = relationship("VerificationRecord", back_populates="post", cascade="all, delete-orphan")

    # Table Constraints & Composite Indexes
    __table_args__ = (
        Index("ix_posts_created_at_id", "created_at", "id"),
        Index("ix_posts_type_community", "post_type", "community_id"),
        Index("ix_posts_teacher_verified", "is_teacher_verified", "post_type"),
    )






