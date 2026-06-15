from pydantic import BaseModel
from pydantic import EmailStr

class RequestOtp(BaseModel):
    email:EmailStr
class VerifyOtp(BaseModel):
    email:EmailStr
    code:str
class ResetPass(BaseModel):
    reset_token:str
    new_password:str

class Otp(BaseModel):
    otp:str