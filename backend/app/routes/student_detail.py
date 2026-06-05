from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.student_detail import StudentDetail
from app.models.user import User
from app.schemas.student_detail import CreateUserProfile
from app.utils.oauth2 import get_current_user

router = APIRouter(
    prefix="/student",
    tags=["Student Detail"]
)

@router.post("/profile", status_code=status.HTTP_201_CREATED)
def create_student_profile(
    body: CreateUserProfile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(StudentDetail).filter(
        StudentDetail.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student profile already exists"
        )

    profile = StudentDetail(
        user_id=current_user.id,
        stream=body.stream,
        program=body.program,
        batch=body.batch
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/profile", status_code=status.HTTP_200_OK)
def get_student_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(StudentDetail).filter(
        StudentDetail.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/profile", status_code=status.HTTP_200_OK)
def update_student_profile(
    body: CreateUserProfile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(StudentDetail).filter(
        StudentDetail.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.stream = body.stream
    profile.program = body.program
    profile.batch = body.batch
    db.commit()
    db.refresh(profile)
    return profile