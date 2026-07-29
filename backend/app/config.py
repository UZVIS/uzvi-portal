import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./portal.db")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")