import os
from dotenv import load_dotenv

# 1. load .env firstly
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.places import water_router
from app.core.config import settings  # מייבאים את ההגדרות שלך
from app.routes.auth import auth_router
from app.routes.usersInfo import info_router
from app.routes.usersLocation import users_locations_router

app = FastAPI(title="Israel Water Sources API")
origins = [
    "http://127.0.0.1:5173",  # הכתובת המדויקת של ויט בדפדפן שלך
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]
# הגדרת CORS מאובטחת ותקינה לפי ה-Settings שלך
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # רשימה מפורשת ויציבה
    allow_credentials=True,  # 🌟 קריטי: מאפשר לדפדפן להוריד ולשמור את העוגייה שלך
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
app.include_router(auth_router)
app.include_router(info_router)
app.include_router(users_locations_router)
if __name__ == "__main__":
    import uvicorn

    # הרצת השרת על פורט 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
