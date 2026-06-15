from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin
from app.models.database import Base


class Community(Base, TimestampMixin):
    """ Community Table """

    __tablename__ = "communities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    kind: Mapped[str] = mapped_column(String(30), nullable=False, default="discussion")

    parent_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    path: Mapped[str] = mapped_column(
        String(512), nullable=False, unique=True, index=True
    )
    depth: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    #At max depth 3 eg engineering/software/events
    created_by: Mapped[int] = mapped_column(Integer, nullable=False)

    parent: Mapped["Community | None"] = relationship(
        "Community", remote_side="Community.id", back_populates="children"
    )
    children: Mapped[list["Community"]] = relationship(
        "Community", back_populates="parent", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("parent_id", "slug", name="uq_community_parent_slug"),
    )