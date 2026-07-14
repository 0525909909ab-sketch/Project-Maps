from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.places import water_router
from app.core.confing import settings  # מייבאים את ההגדרות שלך
from app.routes.auth import auth_router
from app.routes.usersLocation import users_locations_router
app = FastAPI(title="Israel Water Sources API")

# הגדרת CORS מאובטחת ותקינה לפי ה-Settings שלך
app.add_middleware(
    CORSMiddleware,
    # משתמשים ברשימת הכתובות שהגדרת (כמו http://localhost:3000 וכו')
    allow_origins=settings.cors_origins_list,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# חיבור הראוטר
app.include_router(water_router)
app.include_router(auth_router)
app.include_router(users_locations_router)
if __name__ == "__main__":
    import uvicorn
    # הרצת השרת על פורט 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
