from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.places import water_router

app = FastAPI(title="Israel Water Sources API")

# הגדרת CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# חיבור הראוטר
app.include_router(water_router)

if __name__ == "__main__":
    import uvicorn
    # הרצת השרת על פורט 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)