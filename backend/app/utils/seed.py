"""
Seed script: inserts the ROOT communities on first run.
Idempotent: skips any root that already exists (matched by slug + null parent),
"""

from __future__ import annotations

import uuid

from sqlalchemy import select

from app.models.database import sessionLocal
from app.models.communities import Community

MODERATOR_ID = 1 #now hard-coded later on will be changed

# (slug, name, kind) for each root community required by the spec.
ROOT_COMMUNITIES: list[tuple[str, str, str]] = [
    ("academics", "Academics", "discussion"),
    ("notes", "Notes", "notes"),
    ("doubts", "Doubts", "discussion"),
    ("placements", "Placements", "discussion"),
    ("events", "Events", "discussion"),
    ("campus-life", "Campus Life", "discussion"),
    ("complaints", "Complaints", "complaint"),
    ("lost-and-found", "Lost and Found", "lost_found"),
    ("announcements", "Announcements", "announcement"),
]


def create_community() -> None:
    """Insert root communities that don't already exist."""
    db = sessionLocal()
    try:
        created = 0
        for slug, name, kind in ROOT_COMMUNITIES:
            exists = db.scalars(
                select(Community).where(
                    Community.parent_id.is_(None), Community.slug == slug
                )
            ).first()
            if exists:
                print(f"  skip   '{slug}' (already exists)")
                continue

            # Root community: path == slug, depth == 0.
            community = Community(
                slug=slug,
                name=name,
                description=f"Root community for {name}.",
                kind=kind,
                parent_id=None,
                path=slug,
                depth=0,
                created_by=MODERATOR_ID,
            )
            db.add(community)
            created += 1
            print(f"  create '{slug}' (kind={kind})")

        db.commit()
        print(f"\nSeed complete. Created {created} new root communities.")
    finally:
        db.close()





