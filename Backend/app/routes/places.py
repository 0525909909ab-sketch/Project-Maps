from fastapi import APIRouter, HTTPException

# import DB client
from app.core.db import supabase

water_router = APIRouter(prefix="/places", tags=["Water Sources"])


@water_router.get("/")

def get_all_water_sources():
    try:
        # 1. הדפסת בדיקה כדי לראות לאיזה פרויקט השרת באמת מקושר
        print(f"--- DEBUG --- פנייה ל-Supabase URL: {SUPABASE_URL}")
        
        # 2. ניסיון שליפה
        response = supabase.table("locations").select("*").execute()
        all_sources = response.data
        
        print(f"--- DEBUG --- נמצאו {len(all_sources)} רשומות בשרת")
        
        # 3. אם זה ריק, ננסה להכניס שורת בדיקה כדי לראות אם היא מופיעה ב-Dashboard שלך
        if len(all_sources) == 0:
            print("--- DEBUG --- מנסה להכניס שורת בדיקה זמנית...")
            test_data = {"name": "בדיקת חיבור שרת", "latitude": 32.8, "longitude": 35.5}
            supabase.table("locations").insert(test_data).execute()
            print("--- DEBUG --- שורת הבדיקה הוכנסה! תבדוק אם היא הגיעה ל-Dashboard שלך")
            
            # שליפה חוזרת
            response = supabase.table("locations").select("*").execute()
            all_sources = response.data

        return {
            "success": True,
            "count": len(all_sources),
            "data": all_sources
        }
        
    except Exception as e:
        print(f"--- DEBUG SHGIA ---: {str(e)}")
        raise HTTPException(status_code=500, detail=f"שגיאה בשליפת הנתונים: {str(e)}")
