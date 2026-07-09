from fastapi import FastAPI

from app.modules.training.router import router as training_router

app = FastAPI(
    title="UZVI Services Employee Portal"
)

app.include_router(training_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }