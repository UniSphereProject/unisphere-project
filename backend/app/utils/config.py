from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOSTNAME:str
    DB_PASSWORD:str
    DB_NAME:str
    DB_USERNAME:str
    SECRET_KEY:str
    ALGORITHM:str
    ACCESS_TOKEN_EXPIRE:int
    BREVO_API_KEY:str
    BREVO_SENDER_EMAIL:str
    BREVO_SENDER_NAME:str
    MODERATOR_EMAIL:str
    MODERATOR_PASSWORD:str

    model_config = {
        "env_file": ".env",
    }

settings=Settings()

