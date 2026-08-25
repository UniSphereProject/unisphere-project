from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.communities import Community
from app.models.user import User
from app.utils.logger import get_logger
logger = get_logger(__name__)

ROOT_COMMUNITIES = [
    ("academics", "Academics", "discussion"),
    ("notes", "Notes", "notes"),
    ("doubts", "Doubts", "discussion"),
    ("placements", "Placements", "discussion"),
    ("events", "Events", "discussion"),
    ("campus-life", "Campus Life", "discussion"),
    ("lost-and-found", "Lost and Found", "lost_found"),
    ("announcements", "Announcements", "announcement"),
    ("complain","Complain","discussion")
]


def create_community(db: Session):
    moderator = db.query(User).filter(User.role == "moderator").first()

    if not moderator:
        logger.info("Moderator not found. Skipping seeding.")
        return

    created = 0

    try:
        for slug, name, kind in ROOT_COMMUNITIES:

            exists = db.scalars(
                select(Community).where(
                    Community.parent_id.is_(None),
                    Community.slug == slug
                )
            ).first()

            if exists:
                continue

            community = Community(
                slug=slug,
                name=name,
                description=f"Root community for {name}.",
                kind=kind,
                parent_id=None,
                path=slug,
                depth=0,
                created_by=moderator.id,
            )

            db.add(community)
            created += 1

        db.commit()
        logger.info("Seed complete: %s communities created", created)

    except Exception:
        db.rollback()
        logger.info("Seeding failed")
        raise