from datetime import datetime
from app.models.database import Base

from sqlalchemy import String, Index, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
class OTP(Base):
    """OTP Details ."""

    __tablename__ = "otp"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id:Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    code:Mapped[str]=mapped_column(String(255),nullable=False,unique=True,default=None)
    expiry_time:Mapped[datetime]=mapped_column(DateTime, nullable=False)
    user = relationship("User", back_populates="otp")


