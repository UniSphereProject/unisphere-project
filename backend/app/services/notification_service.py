

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lost_found import MatchRecord, Notification
from app.models.posts import Post
from app.models.user import User
from app.services.websocket_manager import manager
from app.utils.logger import get_logger
from app.utils.otp_email import send_email_via_brevo

logger = get_logger(__name__)


# ── Core delivery helper ─────────────────────────────────────────────


def _deliver(
    db: Session,
    user: User,
    *,
    type: str,
    title: str,
    body: str,
    match_id: int | None = None,
    post_id: int | None = None,
    email_subject: str | None = None,
    email_html: str | None = None,
) -> Notification:
    """Persist a notification, push it live, and optionally email it."""

    # 1. Persist (source of truth)
    notification = Notification(
        user_id=user.id,
        type=type,
        title=title,
        body=body,
        match_id=match_id,
        post_id=post_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    # 2. Live push (best-effort)
    manager.send_to_user_sync(
        user.id,
        {
            "event": "notification",
            "data": {
                "id": notification.id,
                "type": type,
                "title": title,
                "body": body,
                "match_id": match_id,
                "post_id": post_id,
                "is_read": False,
                "created_at": notification.created_at.isoformat(),
            },
        },
    )

    # 3. Email via Brevo (best-effort)
    if email_subject and email_html:
        try:
            send_email_via_brevo(user.email, email_subject, email_html)
        except Exception as exc:
            logger.warning("Brevo email to %s failed: %s", user.email, exc)

    return notification


# ── Email templates ──────────────────────────────────────────────────


def _match_found_email_html(user_name: str, own_post: Post, other_post: Post, score: float) -> str:
    return f"""
    <html><body style="font-family: Arial, sans-serif; color: #333;">
      <h2>🔍 Possible match for your Lost &amp; Found post!</h2>
      <p>Hi {user_name},</p>
      <p>Our AI matching system found a post that may match yours:</p>
      <table style="border-collapse: collapse; margin: 12px 0;">
        <tr>
          <td style="padding: 6px 12px; font-weight: bold;">Your post</td>
          <td style="padding: 6px 12px;">{own_post.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; font-weight: bold;">Matched post</td>
          <td style="padding: 6px 12px;">{other_post.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; font-weight: bold;">Match confidence</td>
          <td style="padding: 6px 12px;">{round(score * 100)}%</td>
        </tr>
      </table>
      <p>Please open the app, review the matched post and confirm whether it is
      your item. A moderator will do the final verification.</p>
      <p style="color:#888; font-size: 12px;">This match was generated automatically —
      it may not be correct.</p>
    </body></html>
    """


def _decision_email_html(user_name: str, decision: str, lost_title: str, found_title: str) -> str:
    verdict = "confirmed ✔" if decision == "confirmed" else "rejected ✖"
    return f"""
    <html><body style="font-family: Arial, sans-serif; color: #333;">
      <h2>Lost &amp; Found match {verdict}</h2>
      <p>Hi {user_name},</p>
      <p>A moderator has <b>{decision}</b> the match between:</p>
      <ul>
        <li>Lost: {lost_title}</li>
        <li>Found: {found_title}</li>
      </ul>
      <p>Open the app for details.</p>
    </body></html>
    """


def notify_match_found(db: Session, match: MatchRecord) -> None:
    """Notify BOTH users involved in a fresh AI match (idempotent)."""
    if match.notified:
        return

    lost_post = db.get(Post, match.lost_post_id)
    found_post = db.get(Post, match.found_post_id)
    if lost_post is None or found_post is None:
        return

    pairs = [
        (lost_post.user, lost_post, found_post),   # loser sees the found post
        (found_post.user, found_post, lost_post),  # finder sees the lost post
    ]
    for user, own_post, other_post in pairs:
        if user is None:
            continue
        _deliver(
            db,
            user,
            type="match_found",
            title="Possible match for your Lost & Found post",
            body=(
                f"Your post '{own_post.title}' may match "
                f"'{other_post.title}' ({round(match.combined_score * 100)}% confidence). "
                f"Please review and confirm."
            ),
            match_id=match.id,
            post_id=other_post.id,
            email_subject="🔍 Possible Lost & Found match on Campus Connect",
            email_html=_match_found_email_html(
                user.name, own_post, other_post, match.combined_score
            ),
        )

    match.notified = True
    db.commit()


def notify_match_user_confirmed(db: Session, match: MatchRecord, confirming_user: User) -> None:
    """User confirmed the match → notify the other user and all moderators."""
    lost_post = db.get(Post, match.lost_post_id)
    found_post = db.get(Post, match.found_post_id)
    if lost_post is None or found_post is None:
        return

    other_user = (
        found_post.user if confirming_user.id == lost_post.user_id else lost_post.user
    )
    if other_user is not None:
        _deliver(
            db,
            other_user,
            type="match_user_confirmed",
            title="A Lost & Found match was confirmed by the other user",
            body=(
                f"{confirming_user.name} confirmed the match between "
                f"'{lost_post.title}' and '{found_post.title}'. "
                f"A moderator will now do the final verification."
            ),
            match_id=match.id,
        )

    # Moderators need to do the final confirmation
    moderators = db.scalars(select(User).where(User.role == "moderator")).all()
    for mod in moderators:
        _deliver(
            db,
            mod,
            type="match_needs_moderation",
            title="Lost & Found match awaiting final confirmation",
            body=(
                f"Match #{match.id}: '{lost_post.title}' ↔ '{found_post.title}' "
                f"was confirmed by a user and needs moderator review."
            ),
            match_id=match.id,
        )


def notify_match_moderator_decision(db: Session, match: MatchRecord, decision: str) -> None:
    """Moderator made the final call → notify both users (with email)."""
    lost_post = db.get(Post, match.lost_post_id)
    found_post = db.get(Post, match.found_post_id)
    if lost_post is None or found_post is None:
        return

    verdict_word = "confirmed" if decision == "confirmed" else "rejected"
    for user in (lost_post.user, found_post.user):
        if user is None:
            continue
        _deliver(
            db,
            user,
            type=f"match_moderator_{verdict_word}",
            title=f"Lost & Found match {verdict_word} by moderator",
            body=(
                f"The match between '{lost_post.title}' and '{found_post.title}' "
                f"was {verdict_word} by a moderator."
            ),
            match_id=match.id,
            email_subject=f"Lost & Found match {verdict_word} — Campus Connect",
            email_html=_decision_email_html(
                user.name, verdict_word, lost_post.title, found_post.title
            ),
        )
