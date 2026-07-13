import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./uzvi_portal.db"
)