from sqlalchemy import create_engine, NullPool
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.utils.config import settings

SQLALCHEMY_DATABASE_URL=f'postgresql://{settings.DB_USERNAME}:{settings.DB_PASSWORD}@{settings.DB_HOSTNAME}/{settings.DB_NAME}'
engine=create_engine(SQLALCHEMY_DATABASE_URL,poolclass=NullPool,)
sessionLocal=sessionmaker(autoflush=False,autocommit=False,bind=engine )
Base=declarative_base()


def get_db():
    db=sessionLocal()
    try:
        yield db
    finally:
        db.close()