from fastapi import FastAPI

app = FastAPI(title="ERPilot API (gecici)")


@app.get("/health")
def health():
    return {"status": "ok"}
