from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.directory.router import router as employee_router
from app.modules.directory.router import team_router
from app.modules.documents.router import router as document_router
from app.modules.onboarding.router import router as onboarding_router
from app.modules.leave.router import router as leave_router
from app.modules.calendar import router as calendar_router


app = FastAPI(title="UZVI Services Employee Portal")

#Frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)
app.include_router(employee_router)
app.include_router(team_router)
app.include_router(document_router)
app.include_router(onboarding_router)
app.include_router(leave_router)
app.include_router(calendar_router.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
