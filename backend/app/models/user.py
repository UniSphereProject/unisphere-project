from enum import Enum

from sqlalchemy import Column, Integer, String,Boolean,ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import text
from sqlalchemy.sql.sqltypes import TIMESTAMP, Enum as SQLEnum
from app.models.base import TimestampMixin
from app.models.database import Base

class UserRoles(Enum):
    student = "student"
    teacher= "teacher"
    moderator="moderator"
class User(Base,TimestampMixin):
    __tablename__="users"

    id=Column(Integer,primary_key=True,nullable=False)
    name=Column(String,primary_key=False,nullable=False)
    email=Column(String,nullable=False,unique=True)
    password=Column(String,primary_key=False,nullable=False)
    role=Column(SQLEnum(UserRoles), nullable=False, default="student")
    is_verified= Column(Boolean, nullable=False, default=False)
    otp=relationship("OTP", back_populates="user",cascade="all, delete-orphan",uselist=False)
    student_profile = relationship(
        "StudentDetail",
        back_populates="user",
        uselist=False,  #  One-to-one
        cascade="all, delete-orphan"
    )
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    profile_image_url = Column(String, nullable=True)
    profile_image_file_id = Column(String, nullable=True)
    reactions = relationship("PostReaction", back_populates="user")
    comments = relationship("PostComment", back_populates="user")
    comment_reactions = relationship("CommentReaction", back_populates="user")
    post_entries = relationship(
        "Post",
        back_populates="user",
        foreign_keys="Post.user_id"
    )












