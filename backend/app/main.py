from fastapi import FastAPI

from app.database import Base, engine
from app.modules.m0_employee.router import router as employee_router
from app.modules.m5_onboarding.router import router as onboarding_router
from app.modules.m8_documents.router import router as document_router
from app.modules.assets.router import router as asset_router

app = FastAPI(title="UZVI Services Employee Portal")

Base.metadata.create_all(bind=engine)

app.include_router(employee_router)
app.include_router(document_router)
app.include_router(onboarding_router)
app.include_router(asset_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}