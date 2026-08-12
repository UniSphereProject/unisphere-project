from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal, Optional, Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserOut

class PostAuthorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    profile_image_url: str | None = None
    role: str = "student"
    batch: str | None = None
class CommunityBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    kind: str
class ReactionSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    likes: int = 0
    dislikes: int = 0
    user_reaction: str | None = None
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
    file_key: str | None = None
    file_url: str | None = None
    file_name: str | None = None
    extra_data: dict[str, Any] | None = None
    image_key: str | None = None
    file_size: int | None = None
    file_type: str | None = None

class PostUpdate(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=300)] | None = None
    body: str | None = None
    status: ComplaintStatus | None = None
    is_anonymous: bool | None = None
    item_state: ItemState | None = None
    image_url: str | None = None
    location: str | None = None
    extra_data: dict[str, Any] | None = None


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    body: str | None
    community_id: int
    post_type: str
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_anonymous: bool
    item_state: str | None
    image_url: str | None = None
    file_url: str | None = None
    file_key: str | None = None
    file_name: str | None = None
    image_key: str | None = None
    file_size: int | None = None
    file_type: str | None = None
    location: str | None
    extra_data: dict[str, Any] | None = None
    technologies: str | None = None
    team_members: str | None = None
    academic_year: str | None = None
    department: str | None = None
    is_teacher_verified: bool = False
    comment_count: int = 0

    # Single user field
    author: PostAuthorOut | None = None

    community: CommunityBrief | None = None
    reaction_summary: ReactionSummaryOut | None = None

    @classmethod
    def model_validate(cls, post, *args, **kwargs):
        instance = super().model_validate(post, *args, **kwargs)

        if not post.is_anonymous and post.user is not None:
            instance.author = PostAuthorOut(
                id=post.user.id,
                name=post.user.name,
                profile_image_url=post.user.profile_image_url,
                role=getattr(post.user, "role", "student"),
            )
        else:
            instance.author = None

        return instance


class PostFeedOut(BaseModel):
    items: list[PostOut]
    next_cursor: str | None
    total_count: int | None = None