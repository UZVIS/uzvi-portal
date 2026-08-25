from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

# Database imports
from app.database import Base, engine, init_db, SessionLocal

# Router imports
from app.modules.directory.router import router as employee_router
from app.modules.directory.router import team_router
from app.modules.attendance.router import router as attendance_router
from app.modules.documents.router import router as document_router
from app.modules.onboarding.router import router as onboarding_router
from app.modules.leave.router import router as leave_router
from app.modules.calendar.router import router as calendar_router
from app.modules.assets.router import router as asset_router
from app.modules.announcements.router import router as announcement_router
from app.modules.helpdesk.router import router as helpdesk_router
from app.modules.training.router import router as training_router
from app.modules.quotes.routes import router as quote_router
from app.modules.recruiting.router import router as recruiting_router
from app.modules.recruiting.router import interview_stage_router

from app.modules.consultant_utilization.router import router as utilization_router
from app.modules.expense_claims.router import router as expenses_router
from app.modules.expense_claims.service import RECEIPT_STORAGE_DIR
from app.modules.performance_goals.router import router as performance_router

# Leave service import for Comp-Off automation
from app.modules.leave.service import sync_comp_off_balances


# ==========================================
# Automated Comp-Off Sync Task
# ==========================================
def automated_comp_off_sync():
    """Runs in the background to check attendance and credit comp-offs."""
    db = SessionLocal()
    try:
        print("⏳ Running Automated Comp-Off Sync...")
        result = sync_comp_off_balances(db)
        print(f"✅ Sync Result: {result}")
    except Exception as e:
        print(f"❌ Error during sync: {e}")
    finally:
        db.close()


# ==========================================
# Lifespan Context Manager (App Startup/Shutdown)
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Database on startup
    init_db()

    # 2. Start Background Scheduler for Automated Tasks
    scheduler = BackgroundScheduler()
    
    # TESTING MODE: Runs every 1 minute. 
    # Use this to verify if the logic works when you mark weekend attendance.
    scheduler.add_job(automated_comp_off_sync, 'interval', minutes=1)
    
    # PRODUCTION MODE: Runs automatically every night at 12:00 AM (Midnight).
    # Uncomment the line below and comment the testing mode above when deploying.
    # scheduler.add_job(automated_comp_off_sync, 'cron', hour=0, minute=0)
    
    scheduler.start()
    
    yield  # Application is running
    
    # 3. Shutdown Scheduler on App Exit
    scheduler.shutdown()


# Initialize FastAPI app with the lifespan manager
app = FastAPI(title="UZVI Services Employee Portal", lifespan=lifespan)

# Create tables (if they don't exist)
Base.metadata.create_all(bind=engine)


# ==========================================
# CORS Middleware Setup
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5179",
        "http://localhost:5180",
    ],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)


# ==========================================
# Registering Application Routers
# ==========================================
app.include_router(employee_router)
app.include_router(team_router)
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(document_router)
app.include_router(onboarding_router)
app.include_router(leave_router)
app.include_router(calendar_router)
app.include_router(asset_router)
app.include_router(announcement_router)
app.include_router(quote_router)
app.include_router(helpdesk_router)

# M6 Training Module: Register training endpoints
app.include_router(training_router)

app.include_router(recruiting_router)
app.include_router(interview_stage_router)
app.include_router(utilization_router)
app.include_router(expenses_router)

# Mount performance router
app.include_router(performance_router, prefix="/api/v1")

# Serve uploaded expense receipts (FR-EXP-01)
app.mount("/receipts", StaticFiles(directory=RECEIPT_STORAGE_DIR), name="receipts")


# ==========================================
# Health Check Endpoint
# ==========================================
@app.get("/health")
def health_check():
    return {"status": "ok"}