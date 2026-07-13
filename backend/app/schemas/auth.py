from datetime import datetime
from enum import Enum
from typing import Optional, Annotated

from pydantic import BaseModel, EmailStr, Field, field_validator
import re
# Email must be:
# user@student.pu.edu.np OR user@pu.edu.np
email_pattern = r"^[a-zA-Z0-9._%+-]+@(student\.pu\.edu\.np|pu\.edu\.np)$"

class Users(BaseModel):
    name: str
    email: Annotated[str, Field(pattern=email_pattern)]
    password:str
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least 1 uppercase letter")

        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least 1 lowercase letter")

        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least 1 number")

        if not re.search(r"[@$!%*?&]", v):
            raise ValueError("Password must contain at least 1 special character")

        return v

class UserOut(BaseModel):
    name:str
    id:int
    role: str
    created_at: datetime


    class Config:
        from_attributes = True
class UserLogin(BaseModel):
    email:EmailStr
    password:str

class Token(BaseModel):
    access_token:str
    token_type:str="bearer"
    user:UserOut
class TokenData(BaseModel):
    id:Optional[str]=None
    scope: Optional[str] = None
class UserRole(str, Enum):
    user = "user"
    moderator = "moderator"
    teacher = "teacher"
class UserRoleUpdate(BaseModel):
    id:int
    role: UserRole