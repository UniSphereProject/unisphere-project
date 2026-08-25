from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

CommunityKind = Literal[
    "discussion", "notes", "complaint", "lost_found", "announcement"
]
ComplaintStatus = Literal["open", "in_progress", "resolved"]
ItemState = Literal["lost", "found"]



class CommunityCreate(BaseModel):
    """Payload to create a community. Client sends parent_id + slug, NOT path(engineering/computer)."""

    slug: Annotated[str, Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")]#pattern ensure that the slug is small
    name: Annotated[str, Field(min_length=1, max_length=150)]
    description: str | None = None
    kind: CommunityKind = "discussion"
    parent_id: int | None = None  # None => root community



class CommunityOut(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    description: str | None
    kind: str
    parent_id: int | None
    path: str
    depth: int


class CommunityTreeOut(CommunityOut):
    """Nested community representation for the frontend tree/picker."""

    children: list["CommunityTreeOut"] = Field(default_factory=list)


