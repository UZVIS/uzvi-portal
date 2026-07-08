from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.modules.announcements.router import router as announcement_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UZVI Employee Portal",
    version="1.0.0"
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Module M9
app.include_router(announcement_router)