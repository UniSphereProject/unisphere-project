from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field
CommunityKind = Literal[
    "discussion", "notes", "complaint", "lost_found", "announcement"
]
ComplaintStatus = Literal["open", "in_progress", "resolved"]
ItemState = Literal["lost", "found"]

class PostCreate(BaseModel):
    """
    Payload to create a post.

    Client does NOT send post_type — the server derives it from the target
    community's kind. Type-specific cross-field validation happens in the
    router (formerly crud.create_post).
    """

    title: Annotated[str, Field(min_length=1, max_length=300)]
    body: str | None = None
    community_id: int
    status: ComplaintStatus | None = None
    is_anonymous: bool = False
    item_state: str | None = None
    image_url: str | None = None
    location: str | None = None


class PostUpdate(BaseModel):
    """Partial update payload. post_type and community cannot change."""

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
    user_id: int
    post_type: str
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_anonymous: bool
    item_state: str | None
    image_url: str | None
    location: str | None


class PostFeedOut(BaseModel):
    """Cursor-paginated feed response."""

    items: list[PostOut]
    # Opaque base64 cursor; pass it back as ?cursor=... for the next page.
    # `None` means no more results.
    next_cursor: str | None