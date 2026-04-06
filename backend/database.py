import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from settings import get_settings

settings = get_settings()

DATABASE_URL = os.getenv("DATABASE_URL", settings.database_url)

if not DATABASE_URL.startswith("postgres"):
    raise ValueError("Loom explicitly requires a PostgreSQL database. Please configure LOOM_DATABASE_URL.")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as db:
        yield db

