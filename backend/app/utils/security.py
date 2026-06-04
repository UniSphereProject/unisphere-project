from passlib.context import CryptContext
import secrets
pwd_context=CryptContext(schemes=["argon2"],deprecated="auto")

def hash_password(password:str):
     return pwd_context.hash(password)

def verify(plain_pass,hashed_password):
    return pwd_context.verify(plain_pass,hashed_password)

# Otp generator
def generate_otp(length=6):
    return ''.join(str(secrets.randbelow(10)) for _ in range(length))





