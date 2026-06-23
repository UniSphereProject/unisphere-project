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


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # fixes from_orm calls

    id: int
    content: str
    is_anonymous: bool
    created_at: datetime
    owner: Optional[UserOut] = None
    parent_id: Optional[int] = None
    replies: List[CommentResponse] = []

    @classmethod
    def from_orm_masked(cls, comment):
        return cls(
            id=comment.id,
            content=comment.content,
            is_anonymous=comment.is_anonymous,
            created_at=comment.created_at,
            parent_id=comment.parent_id,
            # hide owner identity when anonymous
            owner=None if comment.is_anonymous else UserOut.from_orm(comment.user),
            replies=[cls.from_orm_masked(r) for r in comment.replies],
        )


CommentResponse.model_rebuild()


class Reaction(BaseModel):
    reaction: ReactionType