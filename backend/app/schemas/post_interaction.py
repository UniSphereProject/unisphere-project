from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict

from app.models.post_interaction import ReactionType
from app.schemas.auth import UserOut


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=500)
    is_anonymous: bool = False
    parent_id: Optional[int] = None
class CommentReactionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    likes: int = 0
    dislikes: int = 0
    user_reaction: str | None = None
class CommentAuthor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    profile_image_url: str | None = None

class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    is_anonymous: bool
    created_at: datetime
    updated_at: datetime

    author: CommentAuthor | None = None

    reaction_summary: CommentReactionSummary = CommentReactionSummary()
    parent_id: Optional[int] = None
    replies: List["CommentResponse"] = []

    @classmethod
    def from_orm_masked(cls, comment):
        return cls(
            id=comment.id,
            content=comment.content,
            is_anonymous=comment.is_anonymous,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            parent_id=comment.parent_id,

            author=(
                None
                if comment.is_anonymous
                else CommentAuthor(
                    id=comment.user.id,
                    name=comment.user.name,
                    profile_image_url=comment.user.profile_image_url,
                    role=getattr(comment.user, "role", "student"),
                )
            ),

            replies=[cls.from_orm_masked(r) for r in comment.replies],
        )

CommentResponse.model_rebuild()
class CommentFeedOut(BaseModel):
    items: list[CommentResponse]
    next_cursor: str | None = None
    total_count: int = 0


class ReactionCreate(BaseModel):
    reaction: ReactionType


class PostReactionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    likes: int = 0
    dislikes: int = 0
    user_reaction: str | None = None


class Reaction(BaseModel):
    reaction: ReactionType