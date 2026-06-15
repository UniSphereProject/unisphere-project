from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.cors import CORSMiddleware

from app.models.database import Base, SessionLocal, engine
from app.models.user import User
from app.models import communities,posts,otp,student_detail
from app.utils.config import settings
from app.utils.logger import get_logger
from app.utils.security import hash_password
from app.utils.seed import create_community
from app.routes.auth import router as auth_router
from app.routes.post import router as post_router
from app.routes.communities import router as communities_router
from app.routes.student_detail import router as student_detail_router
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables checked/created successfully")

        create_community()
        logger.info("Root communities created")

        if settings.MODERATOR_EMAIL and settings.MODERATOR_PASSWORD:

            existing = (
                db.query(User)
                .filter(User.email == settings.MODERATOR_EMAIL)
                .first()
            )

            if not existing:
                moderator = User(
                    name="Moderator",
                    email=settings.MODERATOR_EMAIL,
                    password=hash_password(settings.MODERATOR_PASSWORD),
                    role="moderator",
                    is_verified=True,
                )

                db.add(moderator)
                db.commit()
                logger.info("Moderator created")

    except SQLAlchemyError:
        db.rollback()
        logger.exception("Startup failed")

    finally:
        db.close()

    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(post_router)
app.include_router(communities_router)
app.include_router(student_detail_router)
@app.get("/", tags=["Root"])
async def root():
    return {"message": "API is Running!!!"}