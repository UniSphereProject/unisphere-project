from enum import Enum

from sqlalchemy import Column, Integer, String,Boolean,ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import text
from sqlalchemy.sql.sqltypes import TIMESTAMP, Enum as SQLEnum
from app.models.base import TimestampMixin
from app.models.database import Base
from app.models.otp import OTP
from app.models.student_detail import StudentDetail
from app.models.token import RefreshToken
from app.models.post_interaction import PostReaction, PostComment, CommentReaction

class UserRoles(Enum):
    student = "student"
    teacher = "teacher"
    moderator = "moderator"
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
    reactions = relationship("app.models.post_interaction.PostReaction", back_populates="user")
    comments = relationship("app.models.post_interaction.PostComment", back_populates="user")
    comment_reactions = relationship("app.models.post_interaction.CommentReaction", back_populates="user")
    post_entries = relationship(
        "app.models.posts.Post",
        back_populates="user",
        foreign_keys="[Post.user_id]"
    )












