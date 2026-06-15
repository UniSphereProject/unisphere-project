from enum import Enum

from sqlalchemy import Column, Integer, String,Boolean,ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import text
from sqlalchemy.sql.sqltypes import TIMESTAMP, Enum as SQLEnum

from app.models.base import TimestampMixin
from app.models.database import Base


class StudentDetail(Base,TimestampMixin):
    __tablename__="student_details"

    user_id=Column(Integer,ForeignKey("users.id"),primary_key=True,nullable=False,)
    stream=Column(String,nullable=False)#later it will be Enum after the stream has been fixed
    program=Column(String,nullable=False)#later it will be Enum after the program has been fixed
    batch=Column(String,nullable=False)
    user=relationship("User",back_populates="student_profile")










