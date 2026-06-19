from fastapi import FastAPI
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.cors import CORSMiddleware

from app.models.database import engine,Base
from app.routes.communities import router as community_router
from app.routes.post import router as post_router
from app.routes.student_detail import router as student_profile_router
from app.routes import auth
from app.utils.logger import get_logger
logger = get_logger(__name__)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables checked/created successfully")

except SQLAlchemyError as exc:
    logger.error("Failed to create tables: %s", exc)

app.include_router(auth.router)
app.include_router(community_router)
app.include_router(student_profile_router)
app.include_router(post_router)



@app.get("/",tags=["Root"])
async def root():
    return {"message":"API is Running!!!"}

@app.get("/health")
def health():
    return {"status": "ok"}

