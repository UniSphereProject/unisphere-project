from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOSTNAME: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_USERNAME: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE: int
    REFRESH_TOKEN_EXPIRE: int
    REFRESH_SECRET_KEY: str
    BREVO_API_KEY: str
    BREVO_SENDER_EMAIL: str
    BREVO_SENDER_NAME: str
    PUBLIC_KEY: str
    PRIVATE_KEY: str
    URL_ENDPOINT: str

    model_config = {
        "env_file": ".env",
    }

settings=Settings()

