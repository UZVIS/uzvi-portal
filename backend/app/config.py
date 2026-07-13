import os


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./portal.db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
