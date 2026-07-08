from fastapi import FastAPI

from app.modules.m0_employee.router import router as employee_router

app = FastAPI(title="UZVI Services Employee Portal")

app.include_router(employee_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
