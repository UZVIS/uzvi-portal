"""
Shared settings, loaded from environment variables.
Per docs/technical-setup-guide.md Section 3 — every module reads config
from here, nobody hardcodes values or reads os.environ directly.
"""
import os


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./portal.db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")


settings = Settings()
