# app/utils/oauth2.py
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import Depends, status, HTTPException, Cookie, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app import schemas, models
from app.utils.config import settings
from app.models.database import get_db

oauth_scheme = OAuth2PasswordBearer(tokenUrl="login")

SECRET_KEY         = settings.SECRET_KEY
REFRESH_SECRET_KEY = settings.REFRESH_SECRET_KEY
ALGORITHM          = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES  = settings.ACCESS_TOKEN_EXPIRE
REFRESH_TOKEN_EXPIRE_MINUTES = settings.REFRESH_TOKEN_EXPIRE




def create_access_token(data: dict):
    """
    Short-lived token (15 min).
    Signed with SECRET_KEY.
    Sent in response body → stored in JS memory on frontend.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict):
    """
    Long-lived token (7 days).
    Signed with REFRESH_SECRET_KEY
    Sent as httpOnly cookie → JS cannot read it.
    Also saved in DB so we can revoke it.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)



def verify_access_token(token: str, credentials_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise credentials_exception

        id = payload.get("user_id")
        if id is None:
            raise credentials_exception

        token_data = schemas.auth.TokenData(id=str(id))
    except JWTError:
        raise credentials_exception
    return token_data


def verify_refresh_token(token: str):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token. Please log in again."
    )
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "refresh":
            raise credentials_exception

        user_id = payload.get("user_id")
        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    return str(user_id)




def set_refresh_cookie(response: Response, refresh_token: str):
    """
    Attach refresh token as httpOnly cookie on the response.
    Browser stores it automatically, JS cannot read it.
    """
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_MINUTES * 60
    )


def clear_refresh_cookie(response: Response):
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        samesite="lax"
    )
def get_current_user(
    token: str = Depends(oauth_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    token_data = verify_access_token(token, credentials_exception)
    user = db.query(models.user.User).filter(
        models.user.User.id == token_data.id
    ).first()

    if not user:
        raise credentials_exception
    return user