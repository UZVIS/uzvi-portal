from fastapi import FastAPI

app = FastAPI(title="UZVI Services Employee Portal")

@app.get("/health")
def health_check():
    return {"status": "ok"}
