

from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler

from app.models.database import sessionLocal
from app.utils.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

_scheduler: BackgroundScheduler | None = None

JOB_ID = "lost_found_matching"


def run_matching_job() -> dict:
    # Imported here so the app can boot even if AI deps aren't installed yet.
    from app.services import matching_service, notification_service

    db = sessionLocal()
    stats = {"embedded": 0, "new_matches": 0, "notified": 0}
    try:
        logger.info("Lost & Found matching job started")

        stats["embedded"] = matching_service.embed_new_posts(db)

        new_matches = matching_service.find_matches(db)
        stats["new_matches"] = len(new_matches)

        for match in new_matches:
            try:
                notification_service.notify_match_found(db, match)
                stats["notified"] += 1
            except Exception:
                db.rollback()
                logger.exception("Failed to notify for match %s", match.id)

        logger.info(
            "Matching job done: %d embedded, %d new matches, %d notified",
            stats["embedded"], stats["new_matches"], stats["notified"],
        )
        return stats
    except Exception:
        db.rollback()
        logger.exception("Lost & Found matching job failed")
        return stats
    finally:
        db.close()


def start_scheduler() -> None:
    """Start the background scheduler (called from the FastAPI lifespan)."""
    global _scheduler

    if not settings.AI_MATCHING_ENABLED:
        logger.info("AI matching disabled (AI_MATCHING_ENABLED=False) — scheduler not started")
        return

    if _scheduler is not None and _scheduler.running:
        return

    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(
        run_matching_job,
        trigger="interval",
        minutes=settings.MATCH_SCHEDULER_INTERVAL_MINUTES,
        id=JOB_ID,
        max_instances=1,       # never run two matching cycles at once
        coalesce=True,         # collapse missed runs into one
        misfire_grace_time=300,
    )
    _scheduler.start()
    logger.info(
        "Lost & Found scheduler started (every %d min)",
        settings.MATCH_SCHEDULER_INTERVAL_MINUTES,
    )


def stop_scheduler() -> None:
    """Stop the scheduler cleanly (called on app shutdown)."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Lost & Found scheduler stopped")
    _scheduler = None
