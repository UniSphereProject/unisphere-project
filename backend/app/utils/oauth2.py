#this is for generating jwt tokens
from datetime import datetime, timedelta, timezone
from jose import JWTError,jwt

from fastapi import Depends,status,HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session


from app import schemas

from app import models
from app.utils.config import settings
from app.models.database import get_db

oauth_scheme=OAuth2PasswordBearer(tokenUrl="login ")
SECRET_KEY = settings.SECRET_KEY
ALGORITHM =settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE
def create_access_token(data:dict  ):
    to_encode=data.copy()
    expire=datetime.now(timezone.utc)+timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp":expire})

    encoded_jwt=jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token:str,credentials_exception):
    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM] )
        id = payload.get("user_id")
        if id is None:
            raise credentials_exception
        token_data = schemas.auth.TokenData(id=str(id))
    except JWTError:
         raise credentials_exception
    return token_data

def get_current_user(token:str=Depends(oauth_scheme ),db: Session = Depends(get_db)):
    credentials_exception= HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                         detail=f" Could not validate credentials",
                                         headers={"WWW-Authenticate": "Bearer"})
    token=verify_access_token(token,credentials_exception )
    user=db.query(models.user.User).filter(models.user.User.id==token.id).first()
    return user