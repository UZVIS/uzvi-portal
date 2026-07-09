from fastapi import FastAPI

from app.modules.m0_employee.router import router as employee_router
from app.modules.m8_documents.router import router as document_router
from app.modules.m5_onboarding.router import router as onboarding_router

# M6 Training Module: Import training router for API registration
from app.modules.training.router import router as training_router


app = FastAPI(title="UZVI Services Employee Portal")


app.include_router(employee_router)
app.include_router(document_router)
app.include_router(onboarding_router)

# M6 Training Module: Register training endpoints with the main FastAPI app
app.include_router(training_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }