from fastapi import FastAPI

<<<<<<< HEAD
from app.modules.m0_employee.router import router as employee_router
from app.modules.attendance.router import router as attendance_router
from app.modules.m8_documents.router import router as document_router
from app.modules.m5_onboarding.router import router as onboarding_router
=======
from app.database import Base, engine
from app.modules.directory.router import router as employee_router
from app.modules.directory.router import team_router
from app.modules.documents.router import router as document_router
from app.modules.onboarding.router import router as onboarding_router
from app.modules.assets.router import router as asset_router
from app.modules.announcements.router import router as announcement_router

# M6 Training Module: Import training router for API registration
from app.modules.training.router import router as training_router
>>>>>>> 640f4be685368cd48104ea5641ecbbd38ae906f5

app = FastAPI(title="UZVI Services Employee Portal")

Base.metadata.create_all(bind=engine)

app.include_router(employee_router)
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(document_router)
app.include_router(onboarding_router)
app.include_router(asset_router)
app.include_router(announcement_router)

# M6 Training Module: Register training endpoints with the main FastAPI app
app.include_router(training_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}