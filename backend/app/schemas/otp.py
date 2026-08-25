from pydantic import BaseModel
from pydantic import EmailStr

class RequestOtp(BaseModel):
    email:EmailStr
class VerifyOtp(BaseModel):
    email:EmailStr
    code:str
class ResetPass(BaseModel):
    new_password:str

class Otp(BaseModel):
    otp:str
class ChangePass(BaseModel):
    current_password:str
    new_password:str