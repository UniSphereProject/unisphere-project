from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class MatchPostBrief(BaseModel):
    """Compact post info embedded in a match response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body: str | None = None
    item_state: str | None = None
    location: str | None = None
    image_url: str | None = None
    user_id: int
    created_at: datetime


class MatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lost_post_id: int
    found_post_id: int
    text_score: float | None = None
    image_score: float | None = None
    combined_score: float
    status: str
    user_reviewed_by: int | None = None
    user_reviewed_at: datetime | None = None
    moderator_reviewed_by: int | None = None
    moderator_reviewed_at: datetime | None = None
    moderator_note: str | None = None
    created_at: datetime

    lost_post: MatchPostBrief | None = None
    found_post: MatchPostBrief | None = None


class MatchReviewIn(BaseModel):
    """Body for the user review endpoint."""
    action: Literal["confirm", "reject"]


class MatchModerationIn(BaseModel):
    """Body for the moderator final-decision endpoint."""
    action: Literal["confirm", "reject"]
    note: str | None = None


# ── Notification schemas ─────────────────────────────────────────────


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    title: str
    body: str | None = None
    match_id: int | None = None
    post_id: int | None = None
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime


class NotificationListOut(BaseModel):
    items: list[NotificationOut]
    unread_count: int
