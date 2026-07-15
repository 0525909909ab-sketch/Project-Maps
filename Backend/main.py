import os
from dotenv import load_dotenv

# 1. load .env firstly
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.places import water_router

app = FastAPI(title="Map Project API")

# --- CORS settings ---
cors_origins_str = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)
origins = cors_origins_str.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- ENDPOINTS ---
@app.get("/api/health")
async def health_check():
    """Check the server is alive"""
    return {"status": "ok", "message": "Backend is running smoothly"}


# Mount routers
app.include_router(water_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
