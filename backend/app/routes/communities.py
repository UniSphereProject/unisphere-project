from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.database import get_db

from app.models.user import User
from app.utils.oauth2 import get_current_user

from app.models.communities import Community
from app.schemas.communities import CommunityOut,ComplaintStatus,CommunityTreeOut,CommunityCreate,CommunityKind

router = APIRouter(prefix="/communities", tags=["communities"])

# Communities may nest at depths 0, 1, 2 eg engineering/software/events
MAX_DEPTH = 2


def get_community(db: Session, community_id: int) -> Community:
    """Fetch a community by id or raise 404."""
    community = db.get(Community, community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")
    return community


@router.post("", response_model=CommunityOut, status_code=201)
def create_community(
    payload: CommunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityOut:
    """
    Create a community, building its materialized path on the server.

    Rules enforced:
      * Root (no parent): path = slug, depth = 0.
      * Child: path = parent.path + "/" + slug, depth = parent.depth + 1.
      * Reject if resulting depth > MAX_DEPTH (too deeply nested) -> 400.
      * Reject if a sibling already uses the same slug -> 400.
    """
    parent: Community | None = None
    if payload.parent_id is not None:
        parent = db.get(Community, payload.parent_id)
        if parent is None:
            raise HTTPException(status_code=404, detail="Parent community not found || User can not create Parent Community")

    # ---- depth check (cheap, uses stored parent.depth) ----
    depth = 0 if parent is None else parent.depth + 1
    if depth > MAX_DEPTH:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Communities may nest at most {MAX_DEPTH + 1} levels deep "
                f"(depths 0..{MAX_DEPTH}); requested depth was {depth}."
            ),
        )

    # ---- sibling-slug uniqueness (within the same parent) ----
    sibling_stmt = select(Community).where(
        Community.parent_id == payload.parent_id,
        Community.slug == payload.slug,
    )
    if db.scalars(sibling_stmt).first() is not None:
        raise HTTPException(
            status_code=400,
            detail=f"A sibling community with slug '{payload.slug}' already exists.",
        )

    # Root path is just the slug; child path prepends the parent's full path.
    path = payload.slug if parent is None else f"{parent.path}/{payload.slug}"

    community = Community(
        slug=payload.slug,
        name=payload.name,
        description=payload.description,
        kind=payload.kind,
        parent_id=payload.parent_id,
        path=path,
        depth=depth,
        created_by=current_user.id,
    )
    db.add(community)
    db.commit()
    db.refresh(community)
    return CommunityOut.model_validate(community)


@router.get("", response_model=list[CommunityOut])
def list_communities(
    parent_id: int | None = Query(
        default=None, description="Return direct children of this community."
    ),
    only_roots: bool = Query(
        default=False, description="Return only root communities (no parent)."
    ),
    kind: str | None = Query(
        default=None,
        description="Filter by community kind: discussion, notes, complaint, lost_found, announcement",
    ),
    db: Session = Depends(get_db),
) -> list[CommunityOut]:
    """
    List communities (flat).

    - If `only_roots` is True, return communities with no parent.
    - Else if `parent_id` is given, return that parent's DIRECT children.
    - Else return all communities (flat).

    Useful for building dropdowns.
    """
    stmt = select(Community)
    if only_roots:
        stmt = stmt.where(Community.parent_id.is_(None))
    elif parent_id is not None:
        stmt = stmt.where(Community.parent_id == parent_id)
    if kind:
        stmt = stmt.where(Community.kind == kind)
    stmt = stmt.order_by(Community.path)
    rows = db.scalars(stmt).all()
    return [CommunityOut.model_validate(r) for r in rows]


@router.get("/tree", response_model=list[CommunityTreeOut])
def get_community_tree(
    db: Session = Depends(get_db),
) -> list[CommunityTreeOut]:
    """
    Return the full community tree (nested) for the frontend picker.

    We sort by `path` so parents always appear before their children, then
    link each node to its parent via a dict lookup. Returns the list of roots.
    """
    rows = db.scalars(
        select(Community).order_by(Community.path)
    ).all()

    # Convert each ORM row into a tree node (children filled in below).
    nodes: dict[int, CommunityTreeOut] = {
        row.id: CommunityTreeOut.model_validate(row) for row in rows
    }

    roots: list[CommunityTreeOut] = []
    for row in rows:
        node = nodes[row.id]
        if row.parent_id is None:
            roots.append(node)
        else:
            # Parent guaranteed to exist already because of the path ordering.
            parent_node = nodes.get(row.parent_id)
            if parent_node is not None:
                parent_node.children.append(node)
            else:
                roots.append(node)
    return roots


@router.get("/{community_id}", response_model=CommunityOut)
def get_community(
    community_id: int, db: Session = Depends(get_db)
) -> CommunityOut:
    """Fetch a single community by id (404 if it doesn't exist)."""
    community = get_community(db, community_id)
    return CommunityOut.model_validate(community)