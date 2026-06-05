# schemas/student_detail.py
from pydantic import BaseModel

class CreateUserProfile(BaseModel):
    stream: str
    program: str
    batch: str

class StudentProfileResponse(CreateUserProfile):
    user_id: int

    class Config:
        from_attributes = True  # replaces orm_mode in Pydantic v2