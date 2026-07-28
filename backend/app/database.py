from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

connect_args = (
    {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all database tables"""
    # Import all models so they register with Base
    from app.modules.directory import models
    from app.modules.attendance import models
    from app.modules.documents import models
    from app.modules.onboarding import models
    from app.modules.assets import models
    from app.modules.announcements import models
    from app.modules.helpdesk import models
    from app.modules.training import models
    from app.modules.recruiting import models
    from app.modules.consultant_utilization import models
    from app.modules.expense_claims import models
    from app.modules.performance_goals import models 
    
    # Create all tables
    Base.metadata.create_all(bind=engine)