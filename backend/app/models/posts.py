from __future__ import annotations
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
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
    community_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    # Mirrors community.kind at creation time so the post "remembers" its shape
    # even if the community's kind were ever changed later.
    post_type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    item_state: Mapped[str | None] = mapped_column(String(10), nullable=True)    # lost_found
    is_anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)     # lost_found location


