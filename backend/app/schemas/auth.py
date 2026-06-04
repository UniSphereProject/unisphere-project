from typing import Optional

from pydantic import BaseModel, EmailStr


class Users(BaseModel):
    name:str
    email:EmailStr
    password:str
    stream:str
class UserOut(BaseModel):
    name:str
    id:int

    class Config:
        from_attributes = True
class UserLogin(BaseModel):
    email:EmailStr
    password:str

class Token(BaseModel):
    access_token:str
    token_type:str
class TokenData(BaseModel):
    id:Optional[str]=None