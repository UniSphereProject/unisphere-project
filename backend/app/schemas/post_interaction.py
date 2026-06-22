from __future__ import annotations

from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.post_interaction import ReactionType
from app.schemas.auth import UserOut

class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=500)
    is_anonymous: bool = False
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    content: str
    is_anonymous: bool
    owner: Optional[UserOut] = None
    parent_id: Optional[int] = None
    replies: List[CommentResponse] = []

    @classmethod
    def from_orm_masked(cls, comment):
        return cls(
            id=comment.id,
            content=comment.content,
            is_anonymous=comment.is_anonymous,
            parent_id=comment.parent_id,
            owner=None if comment.is_anonymous else UserOut.from_orm(comment.user),
            replies=[cls.from_orm_masked(r) for r in comment.replies]
        )
CommentResponse.model_rebuild()

class Reaction(BaseModel):
    reaction:ReactionType
