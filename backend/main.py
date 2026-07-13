from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.cors import CORSMiddleware

from app.models.database import engine,Base,sessionLocal
from app.routes.communities import router as community_router
from app.routes.post import router as post_router
from app.routes.student_detail import router as student_profile_router
from app.routes.post_interaction import router as post_interation_router
from app.routes.upload import router as upload_router
from app.models.past_project import PastProject
from app.routes.moderator import router as moderator_router
# from app.routes.claims import router as claims_router
# from app.routes.moderation import router as moderation_router
# from app.routes.notifications import router as notifications_router
from app.routes.past_project import router as past_project_router

from app.routes import auth
from app.utils.logger import get_logger
from app.models.user import User
from app.models.verification_record import VerificationRecord
# from app.models.lost_found import PostEmbedding, MatchRecord, Claim, Notification
from app.utils.config import settings
from app.utils.security import hash_password
from app.utils.seed import create_community
# from app.utils.scheduler import start_scheduler, stop_scheduler

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = sessionLocal()

    try:
        # with engine.connect() as conn:
        #     # conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        #     conn.commit()
        # logger.info("pgvector extension ready")

        Base.metadata.create_all(bind=engine)
        logger.info("DB ready")

        moderator = db.query(User).filter(User.role == "moderator").first()

        if not moderator:
            moderator = User(
                name="Moderator",
                email=settings.MODERATOR_EMAIL,
                password=hash_password(settings.MODERATOR_PASSWORD),
                role="moderator",
                is_verified=True,
            )
            db.add(moderator)
            db.commit()
            db.refresh(moderator)

        logger.info("Moderator ready")

        create_community(db)

    except Exception:
        db.rollback()
        logger.info("Startup failed")
        raise

    finally:
        db.close()

    # start_scheduler()
    yield
    # stop_scheduler()
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# try:
#     Base.metadata.create_all(bind=engine)
#     logger.info("Database tables checked/created successfully")
#
# except SQLAlchemyError as exc:
#     logger.error("Failed to create tables: %s", exc)

app.include_router(auth.router)
app.include_router(community_router)
app.include_router(student_profile_router)
app.include_router(post_router)
app.include_router(post_interation_router)
app.include_router(upload_router)
# app.include_router(claims_router)
# app.include_router(moderation_router)
# app.include_router(notifications_router)
app.include_router(moderator_router)
app.include_router(past_project_router)



@app.get("/",tags=["Root"])
async def root():
    return {"message":"API is Running!!!"}

@app.get("/health")
def health():
    return {"status": "ok"}







