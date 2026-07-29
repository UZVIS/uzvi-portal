import os
from dotenv import load_dotenv
<<<<<<< HEAD

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./portal.db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
=======
>>>>>>> origin/main

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./portal.db")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")