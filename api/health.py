from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "airwatch-pro", "platform": "vercel"}

@app.get("/")
def root():
    return {"message": "AirWatch Pro API", "status": "running", "platform": "vercel"}

# Vercel serverless function handler
def handler(request):
    return app(request)