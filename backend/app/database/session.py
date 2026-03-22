from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import DATABASE_URL

# Railway gives postgres:// but SQLAlchemy needs postgresql://
db_url = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)