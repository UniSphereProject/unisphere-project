from __future__ import annotations
import base64
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.posts import Post
from app.models.communities import Community
from app.models.user import User
from app.models.post_interaction import PostReaction, PostComment
from app.schemas.post import *
from app.utils.oauth2 import get_current_user
from app.utils.supabase_client import supabase_client

from app.schemas.post import PostOut, PostAuthorOut, CommunityBrief, PostCreate, PostUpdate, PostFeedOut

from app.schemas.post import ReactionSummaryOut

router = APIRouter(tags=["Posts"])

REQUIRED_FIELDS_BY_TYPE = {
    "discussion": [],
    "notes": ["file_url"],
    "project": ["file_url"],
    "complaint": [],
    "lost_found": ["item_state"],
    "announcement": [],
}


# ── HELPERS ──────────────────────────────────────────────────────────────────


def _get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


def _encode_cursor(created_at: datetime, post_id: int) -> str:
    raw = f"{created_at.isoformat()}|{post_id}"
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii")


def _decode_cursor(cursor: str) -> tuple[datetime, int]:
    try:
        raw = base64.urlsafe_b64decode(cursor.encode("ascii")).decode("utf-8")
        created_at_str, id_str = raw.split("|", 1)
        return datetime.fromisoformat(created_at_str), int(id_str)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid cursor.") from exc


def _enrich_post(db: Session, post: Post, current_user_id: int | None = None) -> PostOut:
    author = None
    if not post.is_anonymous and post.user:
        author = PostAuthorOut(
            id=post.user.id,
            name=post.user.name,
            profile_image_url=post.user.profile_image_url,
            role=str(post.user.role.value),
        )

    community = None
    if post.community:
        community = CommunityBrief.model_validate(post.community)

    like_count = (
        db.query(func.count(PostReaction.id))
        .filter(PostReaction.post_id == post.id, PostReaction.reaction == "like")
        .scalar()
    ) or 0

    dislike_count = (
        db.query(func.count(PostReaction.id))
        .filter(PostReaction.post_id == post.id, PostReaction.reaction == "dislike")
        .scalar()
    ) or 0

    user_reaction = None
    if current_user_id:
        ur = (
            db.query(PostReaction.reaction)
            .filter(PostReaction.post_id == post.id, PostReaction.user_id == current_user_id)
            .first()
        )
        if ur:
            user_reaction = str(ur[0])

    reaction_summary = ReactionSummaryOut(
        likes=like_count, dislikes=dislike_count, user_reaction=user_reaction
    )
    comment_count = (
        db.query(func.count(PostComment.id)).filter(PostComment.post_id == post.id).scalar()
    ) or 0

    return PostOut(
        id=post.id,
        title=post.title,
        body=post.body,
        community_id=post.community_id,
        post_type=post.post_type,
        status=post.status,
        item_state=post.item_state,
        location=post.location,
        image_url=post.image_url,
        file_url=post.file_url,
        file_name=post.file_name,
        file_type=post.file_type,
        extra_data=post.extra_data,
        is_teacher_verified=post.is_teacher_verified,
        comment_count=comment_count,
        is_anonymous=post.is_anonymous,
        author=author,
        community=community,
        reaction_summary=reaction_summary,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )




@router.post("/posts", response_model=PostOut, status_code=201)
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = db.get(Community, payload.community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")

    post_type = community.kind
    if post_type == "announcement" and str(current_user.role) == "moderator":
        raise HTTPException(status_code=403, detail="Only moderators can post announcements.")

    data = payload.model_dump()
    if post_type not in REQUIRED_FIELDS_BY_TYPE:
        raise HTTPException(status_code=400, detail=f"Unknown post type '{post_type}'.")

    missing = [f for f in REQUIRED_FIELDS_BY_TYPE[post_type] if data.get(f) in (None, "")]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Post of type '{post_type}' requires: {', '.join(missing)}.",
        )

    extra_data = {}
    if data.get("technologies"):
        extra_data["technologies"] = data["technologies"]
    if data.get("team_members"):
        extra_data["team_members"] = data["team_members"]
    if data.get("academic_year"):
        extra_data["academic_year"] = data["academic_year"]
    if data.get("department"):
        extra_data["department"] = data["department"]
    if payload.extra_data:
        extra_data.update(payload.extra_data)

    post = Post(
        title=data["title"],
        body=data.get("body"),
        community_id=community.id,
        user_id=current_user.id,
        post_type=post_type,
        status="open" if post_type == "complaint" else None,
        is_anonymous=data.get("is_anonymous", False),
        item_state=data.get("item_state"),
        location=data.get("location"),
        image_url=data.get("image_url"),
        file_url=data.get("file_url"),
        image_key=data.get("image_key"),
        file_size=data.get("file_size"),
        file_type=data.get("file_type"),
        file_key=data.get("file_key"),
        file_name=data.get("file_name"),
        extra_data=extra_data if extra_data else None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    db.refresh(post, attribute_names=["user", "community"])
    return _enrich_post(db, post, current_user.id)


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    post = _get_post_or_404(db, post_id)
    db.commit()
    return _enrich_post(db, post, current_user.id if current_user else None)


@router.patch("/posts/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    payload: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = _get_post_or_404(db, post_id)
    is_author = post.user_id == current_user.id
    is_moderator = str(current_user.role) == "moderator"

    if not is_author and not is_moderator:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post.")

    changes = payload.model_dump(exclude_unset=True)
    if not is_author and is_moderator:
        allowed = {"status"}
        disallowed = set(changes.keys()) - allowed
        if disallowed:
            raise HTTPException(
                status_code=400,
                detail=f"Moderators can only change status. Remove: {', '.join(disallowed)}",
            )

    for field, value in changes.items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)
    return _enrich_post(db, post, current_user.id)


@router.get("/feed", response_model=PostFeedOut)
def get_feed(
    post_type: str | None = Query(
        default=None,
        description="Filter: discussion, announcement, lost_found, notes, project, complaint",
    ),
    community_id: int | None = Query(default=None, description="Filter to community and children"),
    status: str | None = Query(
        default=None, description="Complaint status: open, in_progress, resolved"
    ),
    item_state: str | None = Query(default=None, description="Lost/Found: lost, found"),
    sort: str = Query(default="latest", description="latest, oldest, top"),
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    limit = max(1, min(limit, 100))
    user_id = current_user.id if current_user else None
    stmt = select(Post)

    if post_type:
        stmt = stmt.where(Post.post_type == post_type)
    if community_id:
        community = db.get(Community, community_id)
        if not community:
            raise HTTPException(status_code=404, detail="Community not found")
        safe = community.path.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        child_ids = db.scalars(
            select(Community.id).where(Community.path.like(f"{safe}%", escape="\\"))
        ).all()
        stmt = stmt.where(Post.community_id.in_(list(child_ids)))
    if status:
        stmt = stmt.where(Post.status == status)
    if item_state:
        stmt = stmt.where(Post.item_state == item_state)

    if cursor:
        c_ca, c_id = _decode_cursor(cursor)
        stmt = stmt.where((Post.created_at < c_ca) | ((Post.created_at == c_ca) & (Post.id < c_id)))

    if sort == "top":
        like_sub = (
            db.query(func.count(PostReaction.id))
            .filter(PostReaction.post_id == Post.id, PostReaction.reaction == "like")
            .correlate(Post)
            .scalar_subquery()
        )
        stmt = stmt.order_by(like_sub.desc(), Post.created_at.desc(), Post.id.desc())
    elif sort == "oldest":
        stmt = stmt.order_by(Post.created_at.asc(), Post.id.asc())
    else:
        stmt = stmt.order_by(Post.created_at.desc(), Post.id.desc())

    posts = db.scalars(stmt.limit(limit + 1)).all()
    next_cursor = None
    if len(posts) > limit:
        posts = posts[:limit]
        last = posts[-1]
        next_cursor = _encode_cursor(last.created_at, last.id)

    return PostFeedOut(
        items=[_enrich_post(db, p, user_id) for p in posts], next_cursor=next_cursor
    )


@router.post("/posts/{post_id}/verify", response_model=PostOut)
def verify_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = _get_post_or_404(db, post_id)
    if str(current_user.role) not in ("teacher", "moderator"):
        raise HTTPException(status_code=403, detail="Only teachers can verify posts.")

    post.is_teacher_verified = True
    post.verified_by = current_user.id
    post.verified_at = datetime.utcnow()

    db.commit()
    db.refresh(post)
    return _enrich_post(db, post, current_user.id)


@router.post("/posts/{post_id}/unverify", response_model=PostOut)
def unverify_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = _get_post_or_404(db, post_id)
    if str(current_user.role) not in ("teacher", "moderator"):
        raise HTTPException(status_code=403, detail="Only teachers can unverify posts.")

    post.is_teacher_verified = False
    post.verified_by = None
    post.verified_at = None

    db.commit()
    db.refresh(post)
    return _enrich_post(db, post, current_user.id)


@router.get("/search", response_model=list[PostOut], tags=["Search"])
def search_posts(
    q: str = Query(..., min_length=2, description="Search query string"),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    """Search posts by keyword in title and body (case-insensitive)."""
    limit = max(1, min(limit, 50))
    pattern = f"%{q}%"
    stmt = (
        select(Post)
        .where(or_(Post.title.ilike(pattern), Post.body.ilike(pattern)))
        .order_by(Post.created_at.desc())
        .limit(limit)
    )
    posts = db.scalars(stmt).all()
    user_id = current_user.id if current_user else None
    return [_enrich_post(db, p, user_id) for p in posts]


@router.get("/trending", response_model=list[PostOut], tags=["Trending"])
def get_trending_posts(
    limit: int = Query(default=10, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    """Return trending posts from the last 7 days, ranked by engagement score.

    Score = (likes * 2 + comments * 1).
    """
    limit = max(1, min(limit, 30))
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    like_sub = (
        db.query(func.count(PostReaction.id))
        .filter(PostReaction.post_id == Post.id, PostReaction.reaction == "like")
        .correlate(Post)
        .scalar_subquery()
    )
    comment_sub = (
        db.query(func.count(PostComment.id))
        .filter(PostComment.post_id == Post.id)
        .correlate(Post)
        .scalar_subquery()
    )

    stmt = (
        select(Post)
        .where(Post.created_at >= seven_days_ago)
        .order_by(
            (func.coalesce(like_sub, 0) * 2 + func.coalesce(comment_sub, 0)).desc(),
            Post.created_at.desc(),
        )
        .limit(limit)
    )
    posts = db.scalars(stmt).all()
    user_id = current_user.id if current_user else None
    return [_enrich_post(db, p, user_id) for p in posts]


@router.get("/posts/{post_id}/view-url")
def get_view_url(
    post_id: int,
    type: str = Query(default="image", description="image or file"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    """
    Return a fresh signed URL for a post's image or file.

    Called by the frontend when a stored signed URL has expired.
    """
    post = _get_post_or_404(db, post_id)

    if type == "image":
        key = getattr(post, "image_key", None)
    elif type == "file":
        key = post.file_key
    else:
        raise HTTPException(status_code=400, detail="type must be 'image' or 'file'")

    if not key:
        # Fallback: if no key exists but a URL does, return the URL directly
        url = post.image_url if type == "image" else post.file_url
        if url:
            return {"url": url, "expires_in": None}
        raise HTTPException(status_code=404, detail="No file associated with this post")

    try:
        signed = supabase_client.get_presigned_url(key, expires=900)
    except Exception:
        raise HTTPException(status_code=503, detail="Failed to generate URL")

    return {"url": signed, "expires_in": 900}


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = _get_post_or_404(db, post_id)
    if post.user_id != current_user.id and str(current_user.role) != "moderator":
        raise HTTPException(status_code=403, detail="Not authorized to delete this post.")

    # Clean up Supabase Storage objects
    if getattr(post, "image_key", None):
        supabase_client.delete_file(post.image_key)
    if post.file_key:
        supabase_client.delete_file(post.file_key)

    db.delete(post)
    db.commit()
