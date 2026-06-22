

from __future__ import annotations

import base64
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.database import get_db

from app.schemas.post import PostOut,PostCreate,PostUpdate,ComplaintStatus,PostFeedOut

from app.models.communities import Community
from app.models.posts import Post

from app.models.user import User
from app.utils.oauth2 import get_current_user

router = APIRouter(tags=["posts"])

# Maps a community kind to the fields a post of that kind MUST provide.
REQUIRED_FIELDS_BY_TYPE: dict[str, list[str]] = {
    "discussion": [],
    "notes": ["file_url"],
    "complaint": [],            # status defaults to "open" if omitted
    "lost_found": ["item_state"],
    "announcement": [],
}



def get_post(db: Session, post_id: int) -> Post:
    """Fetch a post by id or raise 404."""
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


def _validate_post_fields(post_type: str, data: dict) -> None:
    """
    Ensure the type-specific required fields are present for `post_type`.
    Raises 400 listing any missing fields.
    """
    if post_type not in REQUIRED_FIELDS_BY_TYPE:
        raise HTTPException(status_code=400, detail=f"Unknown post type '{post_type}'.")

    missing = [
        field
        for field in REQUIRED_FIELDS_BY_TYPE[post_type]
        if data.get(field) in (None, "")
    ]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Post of type '{post_type}' requires: {', '.join(missing)}.",
        )


# A cursor encodes the (created_at, id) of the LAST item on the current page.
# We base64-encode the string "created_at_iso|id" so it's opaque to clients
# and URL-safe. To fetch the next page we ask for rows strictly "older" than
# this cursor in our (created_at DESC, id DESC) ordering.

def _encode_cursor(created_at: datetime, post_id: int) -> str:
    """Encode (created_at, id) into an opaque base64 cursor string."""
    raw = f"{created_at.isoformat()}|{post_id}"
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii")


def _decode_cursor(cursor: str) -> tuple[datetime, int]:
    """Decode a base64 cursor back into (created_at, id). Raises 400 if malformed."""
    try:
        raw = base64.urlsafe_b64decode(cursor.encode("ascii")).decode("utf-8")
        created_at_str, id_str = raw.split("|", 1)
        return datetime.fromisoformat(created_at_str), int(id_str)
    except Exception as exc:  # noqa: BLE001 - we want any failure -> 400
        raise HTTPException(status_code=400, detail="Invalid cursor.") from exc



@router.post("/posts", response_model=PostOut, status_code=201)
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    """
    Create a post in a community.

    The server reads the community's `kind`, sets the post's `post_type`, and
    validates type-specific required fields (e.g. post_status -> open).
    """
    community = db.get(Community, payload.community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")

    post_type = community.kind  # post mirrors the community's kind
    if post_type == "announcement" and not current_user.role!="moderator":
        raise HTTPException(403, "Only Moderator Can post announcements.")

    data = payload.model_dump()
    _validate_post_fields(post_type, data)

    # Per-kind sensible defaults.
    if post_type == "complaint" and not data.get("status"):
        data["status"] = "open"

    post = Post(
        title=data["title"],
        body=data["body"],
        community_id=community.id,
        user_id=current_user.id,
        post_type=post_type,
        status=data.get("status"),
        is_anonymous=data.get("is_anonymous", False),
        item_state=data.get("item_state"),
        image_url=data.get("image_url"),
        location=data.get("location"),

    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return PostOut.model_validate(post)


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)) -> PostOut:
    """Fetch a single post by id (404 if not found)."""
    post = get_post(db, post_id)
    return PostOut.model_validate(post)


@router.patch("/posts/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    payload: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PostOut:
    """
    Partially update a post. Only the author may edit (otherwise 403).
    Only fields explicitly sent by the client are changed (exclude_unset).
    """
    post = get_post(db, post_id)

    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the author may edit this post.")

    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)
    return PostOut.model_validate(post)


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a post. Only the author may delete (otherwise 403)."""
    post = get_post(db, post_id)
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the author may delete this post.")
    db.delete(post)
    db.commit()
    # 204 No Content -> return nothing.


@router.get("/feed", response_model=PostFeedOut)
def get_feed(
    community_path: str | None = Query(
        default=None,
        description=(
            "If given, return posts from this community AND its sub-communities "
            "(prefix match on the materialized path). Omit for the global feed."
        ),
    ),
    cursor: str | None = Query(
        default=None, description="Opaque cursor from the previous page."
    ),
    limit: int = Query(default=20, ge=1, le=100, description="Page size (max 100)."),
    db: Session = Depends(get_db),
) -> PostFeedOut:
    """
    Cursor-paginated post feed, ordered by created_at DESC, id DESC.

    - If `community_path` is given, include that community AND all its
      sub-communities via a prefix match on the materialized path.
    - Pass the returned `next_cursor` back as `cursor` to fetch the next page.
    - A `null` next_cursor means there are no more results.
    """
    # Clamp the page size to keep queries bounded.
    limit = max(1, min(limit, 100))

    stmt = select(Post)

    # ---- subtree filter via materialized path prefix ----
    if community_path:
        safe_prefix = (
            community_path.replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_")
        )
        stmt = stmt.where(
            Post.community_id.in_(
                select(Community.id).where(
                    Community.path.like(f"{safe_prefix}%", escape="\\")
                )
            )
        )

    # ---- keyset (cursor) condition ----
    # We want rows strictly "after" the cursor in DESC ordering, i.e. older.
    if cursor:
        c_created_at, c_id = _decode_cursor(cursor)
        stmt = stmt.where(
            (Post.created_at < c_created_at)
            | (
                (Post.created_at == c_created_at)
                & (Post.id < c_id)
            )
        )

    # Order must match the keyset comparison exactly.
    stmt = stmt.order_by(
        Post.created_at.desc(), Post.id.desc()
    ).limit(limit + 1)  # fetch one extra row to detect if there's a next page

    rows = db.scalars(stmt).all()

    # If we got the extra row, there's another page; drop it and build a cursor.
    next_cursor: str | None = None
    if len(rows) > limit:
        rows = rows[:limit]
        last = rows[-1]
        next_cursor = _encode_cursor(last.created_at, last.id)

    return PostFeedOut(
        items=[PostOut.model_validate(r) for r in rows],
        next_cursor=next_cursor,
    )