from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.past_project import ProjectType, VerificationStatus

from app.models.past_project import ProjectType
class PastProjectCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str
    project_type: ProjectType
    team_members: list[str]
    batch: str = Field(..., max_length=255)
    stream: str = Field(..., max_length=255)


class VerifierInfo(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class PastProjectOut(BaseModel):
    id: int
    title: str
    description: str
    project_type: ProjectType
    team_members: list[str]
    batch: str
    stream: str

    file_url: str | None = None
    file_name: str | None = None
    file_size: int | None = None
    file_type: str | None = None

    submitted_by: int
    submitter: VerifierInfo | None = None
    verification_status: VerificationStatus
    verified_by: int | None = None
    verifier: VerifierInfo | None = None
    verified_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PastProjectVerifyRequest(BaseModel):
    status: VerificationStatus
    rejection_reason: str | None = None
class PastProjectUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    project_type: ProjectType | None = None
    team_members: list[str] | None = None
    batch: str | None = None
    stream: str | None = None