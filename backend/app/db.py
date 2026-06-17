from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def sync_schema() -> None:
    # Lightweight column sync for local dev on existing databases.
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(200) NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS completed_projects INTEGER NOT NULL DEFAULT 0"))
        conn.execute(text("ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS project_price_range VARCHAR(200) NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE company_projects ADD COLUMN IF NOT EXISTS client_name VARCHAR(200) NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS user_prompt TEXT NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255) NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(1000) NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_kind VARCHAR(50) NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE messages ALTER COLUMN body SET DEFAULT ''"))


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
