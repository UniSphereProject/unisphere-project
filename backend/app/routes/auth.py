from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.auth import UserLogin
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

router=APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register",status_code=status.HTTP_201_CREATED)
def create_user(payload:auth.Users,db: Session = Depends(get_db)):
    otp_code=generate_otp()
    hash_pass=hash_password(payload.password)
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
    return {"message": "OTP processed", "email_delivery": "sent" if delivered else "failed"}

@router.post("/verify/{id}")
def verify_otp(id: int, payload: otp.Otp, db: Session = Depends(get_db)):
    user = db.query(models.user.User).filter(models.user.User.id == id).first()
    if not user:
        return {"error": "User not found"}
    if payload.otp != user.otp.code:
        return {"error": "Invalid OTP"}
    user.is_verified = True
    user.otp=None
    db.commit()
    db.refresh(user)
    return {"message": "OTP Verified"}
@router.post("/forgot-password")
def forgot_password(payload: otp.RequestOtp, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    generic_message = {"message": "If  email exists, an OTP has been sent."}
    if not user:
        return generic_message
    otp_code = generate_otp()
    if user.otp:
        user.otp.code = otp_code
        user.otp.used_flag = False
        user.otp.expiry_time = datetime.utcnow() + timedelta(minutes=15)
    else:
        new_otp = models.OTP(
            user_id=user.id,
            code=otp_code,
            expiry_time=datetime.utcnow() + timedelta(minutes=15)
        )
        db.add(new_otp)
        db.commit()
        delivered = send_email_via_brevo(
            to_email=user.email,
            subject="Reset Your Password",
            html_content=f"<html><body>Use this OTP to reset your password: <b>{otp}</b></body></html>",
        )
        return {"message": "OTP processed", "email_delivery": "sent" if delivered else "failed"}
@router.post("/verify-otp")
def verify_otp(payload: otp.VerifyOtp, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    invalid_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired OTP"
    )
    if not user or not user.otp:
        raise invalid_exception
    if user.otp.code != payload.code:
        raise invalid_exception
    if user.otp.used_flag:
        raise invalid_exception

    if datetime.utcnow() > user.otp.expiry_time:
        raise invalid_exception
    user.otp.used_flag = True
    db.commit()
    reset_token = oauth2.create_access_token(
        data={"user_id": user.id, "scope": "password_reset"}

    )
    return {"reset_token": reset_token, "message": "OTP verified successfully."}

@router.post("/login",response_model=auth.Token)
def log_in(user_credentials:UserLogin,db: Session = Depends(get_db)):
    user = db.query(models.user.User).filter(
        models.user.User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Invalid Credentials")
    if not verify(user_credentials.password,user.password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN ,
                            detail="Invalid Credentials")
    # create a token
    access_token=oauth2.create_access_token(data={"user_id":user.id})
    return {"access_token": access_token, "token_type": "bearer"}




@router.patch("/change-password")
def change_password(
        payload: otp.ResetPass,
        token: str = Depends(oauth_scheme),
        db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    token_data = oauth2.verify_access_token(token, credentials_exception)
    if token_data.scope != "password_reset":
        raise HTTPException(status_code=403, detail="Invalid token type.")
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if not user:
        raise credentials_exception
    hashed_pass = hash_password(payload.new_password)
    user.password = hashed_pass
    db.commit()
    return {"message": "Password successfully updated. You may now log in."}









