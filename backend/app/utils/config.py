from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOSTNAME:str
    DB_PASSWORD:str
    DB_NAME:str
    DB_PORT:str
    DB_USERNAME:str
    SECRET_KEY:str
    ALGORITHM:str
    ACCESS_TOKEN_EXPIRE:int
    REFRESH_TOKEN_EXPIRE:int
    REFRESH_SECRET_KEY:str
    BREVO_API_KEY:str
    BREVO_SENDER_EMAIL:str
    BREVO_SENDER_NAME:str
    PUBLIC_KEY:str
    PRIVATE_KEY:str
    URL_ENDPOINT:str
    MODERATOR_EMAIL:str
    MODERATOR_PASSWORD:str

    # MINIO_ENDPOINT: str
    # MINIO_ACCESS_KEY: str
    # MINIO_SECRET_KEY: str
    # MINIO_BUCKET_NAME: str
    # MINIO_EXTERNAL_ENDPOINT: str
    # MINIO_USE_SSL: bool = False
    SUPABASE_URL:str
    SUPABASE_KEY :str
    SUPABASE_BUCKET:str
    SBERT_MODEL_NAME: str = "all-MiniLM-L6-v2"
    CLIP_MODEL_NAME: str = "clip-ViT-B-32"
    MATCH_SCORE_THRESHOLD: float = 0.60
    MATCH_TEXT_WEIGHT: float = 0.6
    MATCH_IMAGE_WEIGHT: float = 0.4
    MATCH_SCHEDULER_INTERVAL_MINUTES: int = 60
    MATCH_LOOKBACK_DAYS: int = 60
    MATCH_TOP_K: int = 5
    AI_MATCHING_ENABLED: bool = True
    model_config = {
        "env_file": ".env",
    }

settings=Settings()

