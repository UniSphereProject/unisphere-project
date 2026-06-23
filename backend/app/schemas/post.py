from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserOut

CommunityKind = Literal[
    "discussion", "notes", "complaint", "lost_found", "announcement"
]
ComplaintStatus = Literal["open", "in_progress", "resolved"]
ItemState = Literal["lost", "found"]


class PostCreate(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=300)]
    body: str | None = None
    community_id: int
    status: ComplaintStatus | None = None
    is_anonymous: bool = False
    item_state: str | None = None
    image_url: str | None = None
    location: str | None = None


class PostUpdate(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=300)] | None = None
    body: str | None = None
    status: ComplaintStatus | None = None
    is_anonymous: bool | None = None
    item_state: ItemState | None = None
    image_url: str | None = None
    location: str | None = None


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body: str | None
    community_id: int
    post_type: str
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_anonymous: bool
    item_state: str | None
    image_url: str | None
    location: str | None

    # user_id intentionally omitted — use owner below for identity
    owner: Optional[UserOut] = None

    @classmethod
    def model_validate(cls, post, *args, **kwargs):
        instance = super().model_validate(post, *args, **kwargs)
        # Mask owner when post is anonymous
        if not post.is_anonymous and post.user is not None:
            instance.owner = UserOut.from_orm(post.user)
        else:
            instance.owner = None
        return instance


class PostFeedOut(BaseModel):
    items: list[PostOut]
    next_cursor: str | None