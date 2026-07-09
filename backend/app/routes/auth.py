from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from datetime import datetime, timedelta
from app.models.token import RefreshToken
from app.utils.config import settings

from app.schemas.auth import UserLogin
from fastapi.security import OAuth2PasswordRequestForm, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from starlette import status

from app import models
from app.models import user
from app.models.database import get_db
from app.models.otp import OTP
from app.models.user import User
from app.schemas import auth, otp
from app.utils import oauth2
from app.utils.oauth2 import oauth_scheme
from app.utils.otp_email import send_email_via_brevo
from app.utils.security import verify, generate_otp, hash_password

from app.utils.oauth2 import get_current_user

from app.schemas.otp import ChangePass

from app.schemas.auth import Token, UserOut

router=APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register",status_code=status.HTTP_201_CREATED)
def create_user(payload:auth.Users,db: Session = Depends(get_db)):

    hash_pass=hash_password(payload.password)

    user=db.query(User).filter(User.email==payload.email).first()
    if user:
        if user.is_verified:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="User Already exists")
        otp_code = generate_otp()
        if user.otp:
            user.otp.code = otp_code
            user.otp.expiry_time = datetime.utcnow() + timedelta(minutes=5)
        else:
            user.otp = OTP(code=otp_code, expiry_time=datetime.utcnow() + timedelta(minutes=5))
        db.commit()
        send_email_via_brevo(to_email=user.email, subject="OTP Verification",
                             html_content=f"<html><body>Your new OTP: <b>{otp_code}</b></body></html>")
        return {"id": user.id, "email": user.email, "message": "OTP resent"}
    otp_code = generate_otp()
    user=User(
    name=payload.name,
    email=payload.email,
    password=hash_pass,
    )
    user.otp = OTP(
        code=otp_code,
        expiry_time=datetime.utcnow() + timedelta(minutes=5)
    )
    delivered = send_email_via_brevo(
        to_email=user.email,
        subject="OTP Verification",
        html_content=f"<html><body>Use this OTP to Register your account: <b>{user.otp.code}</b></body></html>",
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "message": "OTP processed",
        "email_delivery": "sent" if delivered else "failed"
    }
@router.post("/verify/{id}")
def verify_otp(id: int, payload: otp.Otp, db: Session = Depends(get_db)):
    user = db.query(models.user.User).filter(models.user.User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User Does not Exist")
    if payload.otp != user.otp.code:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid or incorrect OTP code.")
    if datetime.utcnow() > user.otp.expiry_time:
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")
    user.is_verified = True
    user.otp=None
    db.commit()
    db.refresh(user)
    return {"message": "OTP Verified. You may Login In Now."}
@router.post("/forgot-password")
def forgot_password(payload: otp.RequestOtp, db: Session = Depends(get_db)):
    user = db.query(models.user.User).filter(models.user.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User Does not Exist")
    otp_code = generate_otp()
    if user.otp:
        user.otp.code = otp_code
        user.otp.expiry_time = datetime.utcnow() + timedelta(minutes=15)
    else:
        new_otp = models.otp.OTP(
            user_id=user.id,
            code=otp_code,
            expiry_time=datetime.utcnow() + timedelta(minutes=15)
        )
        db.add(new_otp)
    db.commit()
    delivered = send_email_via_brevo(
        to_email=user.email,
        subject="Reset Your Password",
        html_content=f"<html><body>Use this OTP to reset your password: <b>{otp_code}</b></body></html>",
    )
    return {"message": "OTP processed", "email_delivery": "sent" if delivered else "failed"}
@router.post("/verify-otp")
def verify_otp(payload: otp.VerifyOtp, db: Session = Depends(get_db)):
    user = db.query(models.user.User).filter(models.user.User.email == payload.email).first()
    invalid_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired OTP"
    )
    if not user or not user.otp:
        raise invalid_exception
    if user.otp.code != payload.code:
        raise invalid_exception
    if datetime.utcnow() > user.otp.expiry_time:
        raise invalid_exception
    db.delete(user.otp)
    db.commit()
    reset_token = oauth2.create_access_token(
        data={"user_id": user.id, "scope": "password_reset"}

    )
    return {"reset_token": reset_token, "message": "OTP verified successfully."}

@router.post("/login")
def login(
    response: Response,
    data:UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid credentials"
        )
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify email first.Verify by clicking register again")
    access_token = oauth2.create_access_token(data={"user_id": str(user.id)})
    refresh_token = oauth2.create_refresh_token(data={"user_id": str(user.id)})
    db_token = RefreshToken(
        user_id    = user.id,
        token      = refresh_token,
        expires_at = datetime.utcnow() + timedelta(
                         minutes=settings.REFRESH_TOKEN_EXPIRE
                     )
    )
    db.add(db_token)
    db.commit()

    oauth2.set_refresh_cookie(response, refresh_token)
    return Token(access_token=access_token, user=UserOut.model_validate(user))



@router.post("/refresh")
def refresh_token(
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    """
    Called automatically by frontend when access token expires (401).
    Browser sends the httpOnly cookie automatically — frontend has no
    direct access to the token string itself.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token. Please log in."
        )

    user_id = oauth2.verify_refresh_token(refresh_token)
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token   == refresh_token,
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False
    ).first()

    if not db_token:

        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id
        ).update({"revoked": True})
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token reuse detected. All sessions terminated. Please log in."
        )

    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired. Please log in again."
        )

    db_token.revoked = True
    db.commit()

    new_access_token  = oauth2.create_access_token(data={"user_id": user_id})
    new_refresh_token = oauth2.create_refresh_token(data={"user_id": user_id})

    new_db_token = RefreshToken(
        user_id    = user_id,
        token      = new_refresh_token,
        expires_at = datetime.utcnow() + timedelta(
                         minutes=settings.REFRESH_TOKEN_EXPIRE
                     )
    )
    db.add(new_db_token)
    db.commit()

    oauth2.set_refresh_cookie(response, new_refresh_token)

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):

    if refresh_token:
        db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token
        ).update({"revoked": True})
        db.commit()

    oauth2.clear_refresh_cookie(response)
    return {"message": "Logged out successfully"}




@router.patch("/reset-password")
def change_password(
        payload: otp.ResetPass,
        credentials: HTTPAuthorizationCredentials = Depends(oauth_scheme),
        db: Session = Depends(get_db)
):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    token_data = oauth2.verify_access_token(token, credentials_exception)
    if token_data.scope != "password_reset":
        raise HTTPException(status_code=403, detail="Invalid token type.")
    user = db.query(models.user.User).filter(models.user.User.id == token_data.id).first()
    if not user:
        raise credentials_exception
    hashed_pass = hash_password(payload.new_password)
    user.password = hashed_pass
    db.commit()
    return {"message": "Password successfully updated. You may now log in."}

@router.patch("/change-password")
def change_password(
        payload: ChangePass,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    if not verify(payload.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully."}







