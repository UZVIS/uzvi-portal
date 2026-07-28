from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine, init_db

from app.modules.directory.router import router as employee_router
from app.modules.attendance.router import router as attendance_router
from app.modules.documents.router import router as document_router
from app.modules.onboarding.router import router as onboarding_router
from app.modules.assets.router import router as asset_router
from app.modules.announcements.router import router as announcement_router
from app.modules.helpdesk.router import router as helpdesk_router
from app.modules.training.router import router as training_router
from app.modules.recruiting.router import router as recruiting_router
from app.modules.recruiting.router import interview_stage_router


from app.modules.consultant_utilization.router import (
    router as utilization_router,
)
from app.modules.expense_claims.router import (
    router as expenses_router,
)
from app.modules.expense_claims.service import RECEIPT_STORAGE_DIR

from app.modules.performance_goals.router import router as performance_router


app = FastAPI(title="UZVI Services Employee Portal")

@app.on_event("startup")
def startup():
    init_db()

Base.metadata.create_all(bind=engine)

app.include_router(employee_router)
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(document_router)
app.include_router(onboarding_router)
app.include_router(asset_router)
app.include_router(announcement_router)
app.include_router(helpdesk_router)
app.include_router(training_router)
app.include_router(recruiting_router)
app.include_router(interview_stage_router)

app.include_router(utilization_router)
app.include_router(expenses_router)


# NEW: Mount performance router
app.include_router(performance_router, prefix="/api/v1")

# Serve uploaded expense receipts (FR-EXP-01)
app.mount("/receipts", StaticFiles(directory=RECEIPT_STORAGE_DIR), name="receipts")


@app.get("/health")
def health_check():
    return {"status": "ok"}