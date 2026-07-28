import os


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./portal.db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
ENVIRONMENT = os.getenv("ENVIRONMENT")