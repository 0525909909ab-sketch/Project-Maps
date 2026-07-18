from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from typing import Optional
from pydantic import BaseModel
from typing import Optional
from app.core.confing import settings
from supabase import create_client, Client

# Initialize the Supabase Client using your settings variables
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Define the router structure matching the frontend API calls
users_locations_router = APIRouter(prefix="/userslocations", tags=["Users Locations"])

# Define the exact incoming JSON body validation schema
class LocationSchema(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float

@users_locations_router.get("/getAll")
def get_all_users_locations():
    """Fetches all custom records from the usersLocations table"""
    try:
        # REMOVED internal double quotes: changed '"usersLocations"' to "usersLocations"
        response = supabase.table("usersLocations").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database fetch crash: {str(e)}")

@users_locations_router.post("/add")
async def add_users_location(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: Optional[UploadFile] = File(None) # שדה התמונה מוגדר כאופציונלי
):
    """Inserts a new user coordinate entry into the database with an optional image"""
    try:
        image_url = None

        # 1. בדיקה האם המשתמש העלה קובץ תמונה
        if image and image.filename:
            # קריאת תוכן הקובץ בצורה אסינכרונית
            file_bytes = await image.read()
            
            # יצירת שם ייחודי לקובץ כדי למנוע דריסת קבצים קיימים
            import uuid
            file_extension = image.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            
            # העלאת הקובץ ל-Supabase Storage (החלף את 'locations_images' בשם ה-Bucket שלך)
            # ודא שהגדרת את ה-Bucket ב-Supabase כ-Public
            bucket_name = "locations_images"
            supabase.storage.from_(bucket_name).upload(
                path=unique_filename,
                file=file_bytes,
                file_options={"content-type": image.content_type}
            )
            
            # קבלת הכתובת הציבורית (URL) של התמונה שהועלתה
            image_url = supabase.storage.from_(bucket_name).get_public_url(unique_filename)

        # 2. הכנת הנתונים לשמירה בטבלה
        data = {
            "name": str(name),
            "description": str(description) if description else None,
            "latitude": float(latitude),
            "longitude": float(longitude),
            "image_url": image_url # הוספת הקישור לתמונה (יהיה מחרוזת או None)
        }
        
        # 3. שמירת המידע בטבלת מסד הנתונים של Supabase
        response = supabase.table("usersLocations").insert(data).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        print("!!! BACKEND DATABASE ERROR DETAILS !!!:", str(e))
        raise HTTPException(status_code=400, detail=f"Database insertion crash: {str(e)}")
