from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lost_found import MatchRecord, PostEmbedding
from app.models.posts import Post
from app.services import embedding_service
from app.utils.config import settings
from app.utils.logger import get_logger
from app.utils.supabase_client import supabase_client

logger = get_logger(__name__)




def _fetch_image_bytes(post: Post) -> bytes | None:
    """Get the raw image bytes for a post (storage key first, URL fallback)."""
    if post.image_key:
        data = supabase_client.download_file(post.image_key)
        if data:
            return data
    if post.image_url:
        try:
            import requests

            resp = requests.get(post.image_url, timeout=20)
            if resp.status_code == 200:
                return resp.content
        except Exception as exc:
            logger.warning("Failed to fetch image for post %s: %s", post.id, exc)
    return None


def embed_new_posts(db: Session) -> int:
    """Create embeddings for lost_found posts that don't have one yet.

    Returns the number of posts embedded.
    """
    lookback = datetime.now(timezone.utc) - timedelta(days=settings.MATCH_LOOKBACK_DAYS)

    posts = db.scalars(
        select(Post)
        .outerjoin(PostEmbedding, PostEmbedding.post_id == Post.id)
        .where(
            Post.post_type == "lost_found",
            Post.item_state.in_(["lost", "found"]),
            Post.created_at >= lookback,
            PostEmbedding.id.is_(None),
        )
        .order_by(Post.id)
    ).all()

    if not posts:
        return 0

    embedded = 0
    for post in posts:
        try:
            text = embedding_service.build_post_text(post.title, post.body, post.location)
            text_vector = embedding_service.embed_text(text)

            image_vector = None
            image_model_used = None
            image_bytes = _fetch_image_bytes(post)
            if image_bytes:
                image_vector = embedding_service.embed_image(image_bytes)
                if image_vector is not None:
                    image_model_used = settings.CLIP_MODEL_NAME

            db.add(
                PostEmbedding(
                    post_id=post.id,
                    item_state=post.item_state,
                    text_embedding=text_vector,
                    image_embedding=image_vector,
                    embedding_model_text=settings.SBERT_MODEL_NAME,
                    embedding_model_image=image_model_used,
                )
            )
            db.commit()
            embedded += 1
        except Exception:
            db.rollback()
            logger.exception("Failed to embed post %s", post.id)

    logger.info("Embedded %d new lost_found post(s)", embedded)
    return embedded


def _cosine_similarity(a: list[float] | None, b: list[float] | None) -> float | None:
    """Cosine similarity of two vectors (they are already L2-normalised)."""
    if a is None or b is None:
        return None
    return float(sum(x * y for x, y in zip(a, b)))


def _combined_score(text_score: float, image_score: float | None) -> float:
    if image_score is None:
        return text_score
    total = settings.MATCH_TEXT_WEIGHT + settings.MATCH_IMAGE_WEIGHT
    return (
        settings.MATCH_TEXT_WEIGHT * text_score
        + settings.MATCH_IMAGE_WEIGHT * image_score
    ) / total


def find_matches(db: Session) -> list[MatchRecord]:
    """Compare every embedded 'lost' post against 'found' posts via pgvector.

    Creates MatchRecord rows (status=pending_user) for new pairs whose
    combined score clears MATCH_SCORE_THRESHOLD. Returns the newly
    created records so the caller can send notifications.
    """
    lookback = datetime.now(timezone.utc) - timedelta(days=settings.MATCH_LOOKBACK_DAYS)

    lost_embeddings = db.scalars(
        select(PostEmbedding)
        .join(Post, Post.id == PostEmbedding.post_id)
        .where(
            PostEmbedding.item_state == "lost",
            Post.created_at >= lookback,
        )
    ).all()

    new_matches: list[MatchRecord] = []

    for lost in lost_embeddings:
        # pgvector: cosine_distance = 1 - cosine_similarity, so ORDER BY
        # distance ASC returns the most similar candidates first.
        candidates = db.scalars(
            select(PostEmbedding)
            .join(Post, Post.id == PostEmbedding.post_id)
            .where(
                PostEmbedding.item_state == "found",
                Post.created_at >= lookback,
            )
            .order_by(
                PostEmbedding.text_embedding.cosine_distance(lost.text_embedding)
            )
            .limit(settings.MATCH_TOP_K)
        ).all()

        for found in candidates:
            text_score = _cosine_similarity(
                _as_list(lost.text_embedding), _as_list(found.text_embedding)
            )
            if text_score is None:
                continue

            image_score = _cosine_similarity(
                _as_list(lost.image_embedding), _as_list(found.image_embedding)
            )
            combined = _combined_score(text_score, image_score)

            if combined < settings.MATCH_SCORE_THRESHOLD:
                continue

            # Skip pairs we already recorded (unique constraint)
            exists = db.scalars(
                select(MatchRecord).where(
                    MatchRecord.lost_post_id == lost.post_id,
                    MatchRecord.found_post_id == found.post_id,
                )
            ).first()
            if exists:
                continue

            record = MatchRecord(
                lost_post_id=lost.post_id,
                found_post_id=found.post_id,
                text_score=round(text_score, 4),
                image_score=round(image_score, 4) if image_score is not None else None,
                combined_score=round(combined, 4),
                status=MatchRecord.STATUS_PENDING_USER,
            )
            db.add(record)
            try:
                db.commit()
                db.refresh(record)
                new_matches.append(record)
                logger.info(
                    "Match found: lost post %s <-> found post %s (score=%.3f)",
                    lost.post_id,
                    found.post_id,
                    combined,
                )
            except Exception:
                db.rollback()
                logger.exception(
                    "Failed to save match %s<->%s", lost.post_id, found.post_id
                )

    return new_matches


def _as_list(vector) -> list[float] | None:
    """pgvector returns numpy arrays; normalise to a plain list or None."""
    if vector is None:
        return None
    if hasattr(vector, "tolist"):
        return vector.tolist()
    return list(vector)
