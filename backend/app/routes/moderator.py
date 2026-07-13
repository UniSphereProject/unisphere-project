from typing import List

from fastapi import APIRouter,status,Depends,HTTPException
from sqlalchemy.orm.session import Session

from app.models.database import get_db
from app.models.user import User
from app.schemas.auth import UserOut, UserRoleUpdate
from app.utils.oauth2 import get_current_user

router=APIRouter(
    prefix="/moderator",
    tags=['Moderator']
)

@router.get("/fetch-users",status_code=status.HTTP_200_OK, response_model=List[UserOut])
def fetch_users(
db: Session = Depends(get_db),
current: User = Depends(get_current_user),
) :
    if current.role != "moderator":
       raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    user = db.query(User).all()
    return user
@router.patch("/change-role")
def change_role(
    payload:UserRoleUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) :
    if current.role.value != "moderator":
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    user = db.query(User).filter(User.id == payload.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    current_role=user.role
    new_role = payload.role
    user.role = new_role
    db.commit()
    return {
        "message": "User Role Changed successfully",
        "user_id": user.id,
        "old_role": current_role,
        "new_role": new_role
    }

