from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.student_detail import StudentDetail
from app.models.user import User
from app.schemas.student_detail import CreateUserProfile
from app.utils.oauth2 import get_current_user
from imagekitio import ImageKit

from app.utils.config import settings



router = APIRouter(
    prefix="/student",
    tags=["Student Detail"]
)

imagekit = ImageKit(
    private_key=settings.PRIVATE_KEY
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

@router.post("/upload-image")
async def upload_image(
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    file_bytes = await file.read()
    file_name = f"profile_{current_user.id}.jpg"
    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
    MAX_SIZE = 10 * 1024 * 1024  # 10MB

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, WebP images allowed")
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "Image must be under 10 MB")

    upload = imagekit.files.upload(
        file=file_bytes,
        file_name=file_name,
        folder="/profiles"
    )
    current_user.profile_image_url = upload.url
    current_user.profile_image_file_id = upload.file_id
    db.commit()
    db.refresh(current_user)

    return {
        "url": upload.url,
        "file_id": upload.file_id
    }

@router.get("/image")
def get_my_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == current_user.id).first()

    if not user.profile_image_url:
        raise HTTPException(status_code=404, detail="No profile image found")

    return {"url": user.profile_image_url, "file_id": user.profile_image_file_id}