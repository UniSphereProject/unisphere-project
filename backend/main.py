from fastapi import FastAPI
from sqlalchemy.exc import SQLAlchemyError

from app.models.database import engine,Base

from app.routes import auth
from app.utils.logger import get_logger
logger = get_logger(__name__)
app = FastAPI()
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables checked/created successfully")

except SQLAlchemyError as exc:
    logger.error("Failed to create tables: %s", exc)

app.include_router(auth.router)




@app.get("/",tags=["Root"])
async def root():
    return {"message":"API is Running!!!"}



