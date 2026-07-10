from fastapi import FastAPI

from app.modules.directory.router import router as employee_router
from app.modules.directory.router import team_router
from app.modules.documents.router import router as document_router
from app.modules.onboarding.router import router as onboarding_router

app = FastAPI(title="UZVI Services Employee Portal")

app.include_router(employee_router)
app.include_router(team_router)
app.include_router(document_router)
app.include_router(onboarding_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
