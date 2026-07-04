

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.user import User
from app.utils.oauth2 import get_current_user
from app.utils.supabase_client import (
    supabase_client,
    MAX_IMAGE_SIZE,
    MAX_FILE_SIZE,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_FILE_TYPES,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload an image file to Supabase Storage.

    Accepted types: jpeg, png, webp, gif
    Max size: 10 MB

    Returns:
        { "url": "<signed-url>", "key": "images/abc123_photo.jpg" }
    """
    if not file.content_type or file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type. Accepted: {', '.join(sorted(ALLOWED_IMAGE_TYPES))}",
        )

    data = await file.read()
    if len(data) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image too large. Max 10MB.",
        )

    try:
        result = supabase_client.upload_file(
            file_data=data,
            filename=file.filename or "image.jpg",
            content_type=file.content_type,
            prefix="images",
            max_size=MAX_IMAGE_SIZE,
            allowed_types=ALLOWED_IMAGE_TYPES,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        logger.exception("Image upload failed")
        raise HTTPException(
            status_code=503,
            detail="Storage service unavailable. Please try again later.",
        )

    return {"url": result["url"], "key": result["key"]}


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a notes/file document to Supabase Storage.

    Accepted types: PDF, DOCX, PPTX, DOC, PPT, TXT
    Max size: 50 MB

    Returns:
        { "url": "<signed-url>", "key": "files/...", "file_name": "...", "file_size": 12345 }
    """
    if not file.content_type or file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Accepted: PDF, DOCX, PPTX, DOC, PPT, TXT",
        )

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Max 50MB.",
        )

    try:
        result = supabase_client.upload_file(
            file_data=data,
            filename=file.filename or "file.pdf",
            content_type=file.content_type,
            prefix="files",
            max_size=MAX_FILE_SIZE,
            allowed_types=ALLOWED_FILE_TYPES,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        logger.exception("File upload failed")
        raise HTTPException(
            status_code=503,
            detail="Storage service unavailable. Please try again later.",
        )

    return {
        "url": result["url"],
        "key": result["key"],
        "file_name": result["file_name"],
        "file_size": result["file_size"],
    }