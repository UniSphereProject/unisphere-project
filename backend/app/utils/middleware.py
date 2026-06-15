from fastapi import Depends, HTTPException, status


from app.models.user import UserRoles, User

from app.utils.oauth2 import get_current_user


class RoleChecker:
    def __init__(self, allowed_roles: list[UserRoles]):
        self.allowed_roles = allowed_roles
    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )
        return

allow_moderator_only = RoleChecker([UserRoles.moderator])
