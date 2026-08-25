from __future__ import annotations

import enum

from sqlalchemy import String, Float, Index, Integer, ForeignKey, Column, Date, Enum, UniqueConstraint, Text, Boolean
from sqlalchemy.orm import relationship

from app.models.base import  TimestampMixin
from app.models.database import Base


class ReactionType(str, enum.Enum):
    LIKE = "like"
    DISLIKE = "dislike"


class PostReaction(Base,TimestampMixin):
    __tablename__ = "post_reactions"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(
        Integer,
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    reaction = Column(Enum(ReactionType), nullable=False)
    __table_args__ = (
        UniqueConstraint(
            "post_id", "user_id",
            name="uq_one_reaction_per_user"
        ),
    )
    post = relationship("Post", back_populates="reactions")
    user = relationship("User", back_populates="reactions")



class PostComment(Base,TimestampMixin):
    __tablename__ = "post_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(
        Integer,
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    parent_id = Column(
        Integer,
        ForeignKey("post_comments.id", ondelete="CASCADE"),
        nullable=True  # null = top-level comment, non-null = reply
    )
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, primary_key=False, default=False)
    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")
    # Still inside PostComment
    replies = relationship("PostComment", back_populates="parent")
    parent = relationship("PostComment", back_populates="replies",remote_side="PostComment.id")
    reactions= relationship("CommentReaction", back_populates="comment",cascade="all, delete-orphan")

class CommentReaction(Base,TimestampMixin):
    __tablename__ = "comment_reactions"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(
        Integer,
        ForeignKey("post_comments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    reaction = Column(Enum(ReactionType), nullable=False)
    __table_args__ = (
        UniqueConstraint(
            "comment_id", "user_id",
            name="uq_one_comment_reaction_per_user"
        ),
    )
    comment= relationship("PostComment", back_populates="reactions")
    user = relationship("User", back_populates="comment_reactions")