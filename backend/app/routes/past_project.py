from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.user import User
from app.utils.oauth2 import get_current_user
from app.utils.supabase_client import supabase_client, ALLOWED_FILE_TYPES, MAX_FILE_SIZE

from app.models.past_project import PastProject, VerificationStatus, ProjectType
from app.schemas.past_projects import PastProjectOut, PastProjectVerifyRequest

from app.models.user import UserRoles

router = APIRouter(prefix="/past-projects", tags=["Past Projects"])


def require_teacher(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != UserRoles.teacher.value:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only teachers can verify projects")
    return current_user

@router.post("", response_model=PastProjectOut, status_code=status.HTTP_201_CREATED)
def create_past_project(
    title: str = Form(...),
    description: str = Form(...),
    project_type: ProjectType = Form(...),
    team_members: list[str] = Form(...),
    batch: str = Form(...),
    stream: str = Form(...),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_meta = {}
    if file is not None:
        raw_bytes = file.file.read()
        uploaded = supabase_client.upload_file(
            file_data=raw_bytes,
            filename=file.filename,
            content_type=file.content_type,
            prefix="past-projects",
            max_size=MAX_FILE_SIZE,
            allowed_types=ALLOWED_FILE_TYPES,
        )
        file_meta = {
            "file_url": uploaded["url"],
            "file_key": uploaded["key"],
            "file_name": uploaded["file_name"],
            "file_size": uploaded["file_size"],
            "file_type": uploaded["file_type"],
        }

    project = PastProject(
        title=title,
        description=description,
        project_type=project_type,
        team_members=team_members,
        batch=batch,
        stream=stream,
        submitted_by=current_user.id,
        verification_status=VerificationStatus.PENDING,
        **file_meta,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[PastProjectOut])
def list_past_projects(
    status_filter: VerificationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PastProject)
    if status_filter:
        query = query.filter(PastProject.verification_status == status_filter)
    return query.order_by(PastProject.created_at.desc()).all()


@router.get("/{project_id}", response_model=PastProjectOut)
def get_past_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(PastProject).filter(PastProject.id == project_id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


@router.patch("/{project_id}/verify", response_model=PastProjectOut)
def verify_past_project(
    project_id: int,
    payload: PastProjectVerifyRequest,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher),
):
    project = db.query(PastProject).filter(PastProject.id == project_id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

    if payload.status == VerificationStatus.REJECTED and not payload.rejection_reason:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Rejection reason required")

    project.verification_status = payload.status
    project.verified_by = teacher.id
    project.verified_at = datetime.now(timezone.utc)
    project.rejection_reason = (
        payload.rejection_reason if payload.status == VerificationStatus.REJECTED else None
    )

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_past_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(PastProject).filter(PastProject.id == project_id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    if project.submitted_by != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your project")
    if project.file_key:
        supabase_client.delete_file(project.file_key)
    db.delete(project)
    db.commit()