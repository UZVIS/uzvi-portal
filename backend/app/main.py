from fastapi import FastAPI

from app.modules.m0_employee.router import router as employee_router
from app.modules.m8_documents.router import router as document_router
from app.modules.m5_onboarding.router import router as onboarding_router
from app.modules.leave.router import router as leave_router




app = FastAPI(title="UZVI Services Employee Portal")

app.include_router(employee_router)
app.include_router(leave_router)
app.include_router(document_router)
app.include_router(onboarding_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
