from __future__ import annotations
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin
from app.models.database import Base


class VerificationRecord(Base, TimestampMixin):
    __tablename__ = "verification_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Foreign Keys
    post_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    verified_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Data Fields (e.g., "verified" or "unverified")
    action: Mapped[str] = mapped_column(String(20), nullable=False)

    # Relationships
    post = relationship("Post", back_populates="verifications")
    verifier = relationship("User", foreign_keys=[verified_by])