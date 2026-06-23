from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.posts import Post
from app.models.user import User
from app.schemas.post_interaction import *
from app.utils.oauth2 import get_current_user

from app.models.post_interaction import PostComment
from app.schemas.post_interaction import PostReactionSummary, ReactionCreate, CommentCreate, CommentAuthor, \
    CommentFeedOut, CommentReactionSummary

from app.models.post_interaction import PostReaction, CommentReaction

from app.schemas.post_interaction import CommentResponse

router = APIRouter(tags=["Post Interactions"])


# ── HELPERS ──────────────────────────────────────────────────────────────────


def _get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post




@router.post("/posts/{post_id}/react", response_model=PostReactionSummary)
def react_to_post(
    post_id: int,
    request: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_post_or_404(db, post_id)
    existing = (
        db.query(PostReaction)
        .filter(PostReaction.post_id == post_id, PostReaction.user_id == current_user.id)
        .first()
    )

    if existing:
        if existing.reaction == request.reaction.value:
            db.delete(existing)
            db.commit()
        else:
            existing.reaction = request.reaction
            db.commit()
    else:
        db.add(
            PostReaction(
                post_id=post_id, user_id=current_user.id, reaction=request.reaction.value
            )
        )
        db.commit()

    likes = (
        db.query(func.count(PostReaction.id))
        .filter(PostReaction.post_id == post_id, PostReaction.reaction == "like")
        .scalar()
    ) or 0
    dislikes = (
        db.query(func.count(PostReaction.id))
        .filter(PostReaction.post_id == post_id, PostReaction.reaction == "dislike")
        .scalar()
    ) or 0
    ur = (
        db.query(PostReaction.reaction)
        .filter(PostReaction.post_id == post_id, PostReaction.user_id == current_user.id)
        .first()
    )

    return PostReactionSummary(
        likes=likes, dislikes=dislikes, user_reaction=str(ur[0]) if ur else None
    )


@router.get("/posts/{post_id}/reactions", response_model=PostReactionSummary)
def get_post_reactions(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    _get_post_or_404(db, post_id)
    likes = (
        db.query(func.count(PostReaction.id))
        .filter(PostReaction.post_id == post_id, PostReaction.reaction == "like")
        .scalar()
    ) or 0
    dislikes = (
        db.query(func.count(PostReaction.id))
        .filter(PostReaction.post_id == post_id, PostReaction.reaction == "dislike")
        .scalar()
    ) or 0

    user_reaction = None
    if current_user:
        ur = (
            db.query(PostReaction.reaction)
            .filter(PostReaction.post_id == post_id, PostReaction.user_id == current_user.id)
            .first()
        )
        if ur:
            user_reaction = str(ur[0])

    return PostReactionSummary(likes=likes, dislikes=dislikes, user_reaction=user_reaction)







@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def add_comment(
    post_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_post_or_404(db, post_id)
    if payload.parent_id:
        parent = db.get(PostComment, payload.parent_id)
        if not parent or parent.post_id != post_id:
            raise HTTPException(status_code=400, detail="Invalid parent comment")

    comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        content=payload.content,
        is_anonymous=payload.is_anonymous,
        parent_id=payload.parent_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    author = (
        None
        if comment.is_anonymous
        else CommentAuthor(
            id=current_user.id,
            name=current_user.name,
            profile_image_url=current_user.profile_image_url,
        )
    )
    return CommentResponse(
        id=comment.id,
        content=comment.content,
        is_anonymous=comment.is_anonymous,
        author=author,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


@router.get("/posts/{post_id}/comments", response_model=CommentFeedOut)
def get_post_comments(
    post_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    _get_post_or_404(db, post_id)
    user_id = current_user.id if current_user else None

    items_db = (
        db.query(PostComment)
        .filter(
            PostComment.post_id == post_id,
            PostComment.parent_id.is_(None),
        )
        .order_by(PostComment.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for item in items_db:
        likes = (
            db.query(func.count(CommentReaction.id))
            .filter(CommentReaction.comment_id == item.id, CommentReaction.reaction == "like")
            .scalar()
        ) or 0
        dislikes = (
            db.query(func.count(CommentReaction.id))
            .filter(CommentReaction.comment_id == item.id, CommentReaction.reaction == "dislike")
            .scalar()
        ) or 0

        user_reaction = None
        if user_id:
            ur = (
                db.query(CommentReaction.reaction)
                .filter(CommentReaction.comment_id == item.id, CommentReaction.user_id == user_id)
                .first()
            )
            if ur:
                user_reaction = str(ur[0])

        replies_db = (
            db.query(PostComment)
            .filter(PostComment.parent_id == item.id)
            .order_by(PostComment.created_at.asc())
            .limit(3)
            .all()
        )

        replies = []
        for r in replies_db:
            ra = (
                None
                if (r.is_anonymous ) and r.user
                else CommentAuthor(
                    id=r.user.id, name=r.user.name, profile_image_url=r.user.profile_image_url
                )
            )
            replies.append(
                CommentResponse(
                    id=r.id,
                    content=r.content,
                    is_anonymous=r.is_anonymous,
                    author=ra,
                    parent_id=r.parent_id,
                    reaction_summary=CommentReactionSummary(),
                    created_at=r.created_at,
                    updated_at=r.updated_at,
                )
            )

        author = (
            None
            if (item.is_anonymous ) and item.user
            else CommentAuthor(
                id=item.user.id, name=item.user.name, profile_image_url=item.user.profile_image_url
            )
        )
        result.append(
            CommentResponse(
                id=item.id,
                content=item.content,
                is_anonymous=item.is_anonymous,
                author=author,
                parent_id=item.parent_id,
                reaction_summary=CommentReactionSummary(
                    likes=likes, dislikes=dislikes, user_reaction=user_reaction
                ),
                created_at=item.created_at,
                updated_at=item.updated_at,
                replies=replies,
            )
        )

    return CommentFeedOut(items=result, total_count=len(result))


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.get(PostComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id and str(current_user.role) != "moderator":
        raise HTTPException(status_code=403, detail="Not authorized")

    comment.content = "[deleted]"
    db.commit()


@router.post("/comments/{comment_id}/react")
def react_to_comment(
    comment_id: int,
    request: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.get(PostComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    existing = (
        db.query(CommentReaction)
        .filter(CommentReaction.comment_id == comment_id, CommentReaction.user_id == current_user.id)
        .first()
    )

    if existing:
        if existing.reaction == request.reaction.value:
            db.delete(existing)
            db.commit()
            msg = "Removed"
        else:
            existing.reaction = request.reaction
            db.commit()
            msg = "Changed"
    else:
        db.add(
            CommentReaction(
                comment_id=comment_id, user_id=current_user.id, reaction=request.reaction.value
            )
        )
        db.commit()
        msg = "Added"

    return {"message": msg}