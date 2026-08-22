"""Database connection and session management."""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.core.config import settings

# Use SQLite for local dev (no PostgreSQL dependency needed)
DATABASE_URL = settings.DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=settings.DEBUG, future=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Sync engine for migrations
sync_engine = create_engine(settings.DATABASE_SYNC_URL, echo=settings.DEBUG)
SyncSession = sessionmaker(sync_engine)

Base = declarative_base()


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    await engine.dispose()
