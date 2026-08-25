from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload
from app.utils.scheduler import run_matching_job
from app.models.database import get_db
from app.models.lost_found import MatchRecord
from app.models.posts import Post
from app.models.user import User
from app.schemas.lost_found import MatchModerationIn, MatchOut, MatchReviewIn
from app.services import notification_service
from app.utils.oauth2 import get_current_user

router = APIRouter(
    prefix="/matches",
    tags=["Lost & Found Matches"]
)


def _get_match_or_404(db: Session, match_id: int) -> MatchRecord:
    match = db.get(
        MatchRecord,
        match_id,
        options=[joinedload(MatchRecord.lost_post), joinedload(MatchRecord.found_post)],
    )
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


def _is_involved(match: MatchRecord, user: User) -> bool:
    return user.id in (match.lost_post.user_id, match.found_post.user_id)


@router.get("", response_model=list[MatchOut])
def list_my_matches(
    status: str | None = Query(default=None, description="Filter by match status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(MatchRecord).options(
        joinedload(MatchRecord.lost_post), joinedload(MatchRecord.found_post)
    )

    if str(current_user.role.value) != "moderator":
        lost_p = select(Post.id).where(Post.user_id == current_user.id).scalar_subquery()
        stmt = stmt.where(
            or_(
                MatchRecord.lost_post_id.in_(lost_p),
                MatchRecord.found_post_id.in_(lost_p),
            )
        )

    if status:
        stmt = stmt.where(MatchRecord.status == status)

    stmt = stmt.order_by(MatchRecord.created_at.desc())
    return [MatchOut.model_validate(m) for m in db.scalars(stmt).all()]


@router.get("/{match_id}", response_model=MatchOut)
def get_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = _get_match_or_404(db, match_id)
    if str(current_user.role.value) != "moderator" and not _is_involved(match, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to view this match")
    return MatchOut.model_validate(match)


@router.post("/{match_id}/review", response_model=MatchOut)
def review_match(
    match_id: int,
    payload: MatchReviewIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = _get_match_or_404(db, match_id)

    if not _is_involved(match, current_user):
        raise HTTPException(status_code=403, detail="You are not involved in this match")

    if match.status != MatchRecord.STATUS_PENDING_USER:
        raise HTTPException(
            status_code=400,
            detail=f"Match is not awaiting user review (status: {match.status})",
        )

    if payload.action == "confirm":
        match.status = MatchRecord.STATUS_USER_CONFIRMED
    else:
        match.status = MatchRecord.STATUS_USER_REJECTED

    match.user_reviewed_by = current_user.id
    match.user_reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(match)

    if match.status == MatchRecord.STATUS_USER_CONFIRMED:
        notification_service.notify_match_user_confirmed(db, match, current_user)

    return MatchOut.model_validate(match)


@router.post("/{match_id}/moderate", response_model=MatchOut)
def moderate_match(
    match_id: int,
    payload: MatchModerationIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if str(current_user.role.value) != "moderator":
        raise HTTPException(status_code=403, detail="Only moderators can perform final confirmation")

    match = _get_match_or_404(db, match_id)

    if match.status not in (
        MatchRecord.STATUS_PENDING_USER,
        MatchRecord.STATUS_USER_CONFIRMED,
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Match already closed (status: {match.status})",
        )

    if payload.action == "confirm":
        match.status = MatchRecord.STATUS_MOD_CONFIRMED
        # Close both posts — item returned to its owner.
        match.lost_post.status = "resolved"
        match.found_post.status = "resolved"
        decision = "confirmed"
    else:
        match.status = MatchRecord.STATUS_MOD_REJECTED
        decision = "rejected"

    match.moderator_reviewed_by = current_user.id
    match.moderator_reviewed_at = datetime.now(timezone.utc)
    match.moderator_note = payload.note
    db.commit()
    db.refresh(match)

    notification_service.notify_match_moderator_decision(db, match, decision)

    return MatchOut.model_validate(match)


@router.post("/run-matching")
def trigger_matching_job(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    if str(current_user.role.value) != "moderator":
        raise HTTPException(status_code=403, detail="Only moderators can trigger matching")
    background_tasks.add_task(run_matching_job)
    return {"message": "Matching job started in background"}
