import os
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.confing import settings
from supabase import create_client, Client

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

water_router = APIRouter(prefix="/places", tags=["Water Sources"])

@water_router.get("/")
def get_all_water_sources(): # שינינו את שם הפונקציה והסרנו את ה-place_id
    try:
        # פנייה ל-Supabase ושליפת כל הרשומות מטבלת locations
        response = supabase.table("locations").select("*").execute()
        
        # המידע הנקי נמצא בתוך response.data כרשימה של דיקשנריז
        all_sources = response.data
        
        # החזרת הנתונים כ-JSON לפרונטאנד
        return {
            "success": True,
            "count": len(all_sources),
            "data": all_sources
        }
        
    except Exception as e:
        # במקרה של שגיאה מול הדאטה-בייס, נחזיר שגיאה מסודרת לפרונטאנד
        raise HTTPException(status_code=500, detail=f"שגיאה בשליפת הנתונים: {str(e)}")