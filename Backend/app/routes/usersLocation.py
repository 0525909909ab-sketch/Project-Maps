from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from typing import Optional
from pydantic import BaseModel
from app.core.config import settings
from supabase import create_client, Client
import uuid

# אתחול לקוח Supabase לפי הגדרות המערכת
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# הגדרת הראוטר
users_locations_router = APIRouter(prefix="/userslocations", tags=["Users Locations"])


class LocationSchema(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float


# 📥 שליפת כל המיקומים
@users_locations_router.get("/getAll")
def get_all_users_locations():
    """Fetches all custom records from the usersLocations table"""
    try:
        response = supabase.table("usersLocations").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database fetch crash: {str(e)}")


# ➕ הוספת מיקום חדש
@users_locations_router.post("/add")
async def add_users_location(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: Optional[UploadFile] = File(None),
):
    """Inserts a new user coordinate entry into the database with an optional image"""
    try:
        image_url = None

        if image and image.filename:
            file_bytes = await image.read()
            file_extension = image.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            bucket_name = "locations_images"

            supabase.storage.from_(bucket_name).upload(
                path=unique_filename,
                file=file_bytes,
                file_options={"content-type": image.content_type},
            )

            image_url = supabase.storage.from_(bucket_name).get_public_url(unique_filename)

        data = {
            "name": str(name),
            "description": str(description) if description else None,
            "latitude": float(latitude),
            "longitude": float(longitude),
            "image_url": image_url,
        }

        response = supabase.table("usersLocations").insert(data).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        print("!!! BACKEND DATABASE ERROR DETAILS !!!:", str(e))
        raise HTTPException(
            status_code=400, detail=f"Database insertion crash: {str(e)}"
        )


# ✏️ עדכון מיקום קיים לפי ID (שימוש ב-Form למניעת קריסות שרת ב-PUT)
@users_locations_router.put("/update/{location_id}")
async def update_users_location(
    location_id: int,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    """Updates an existing user location by ID"""
    try:
        data_to_update = {
            "name": str(name),
            "description": str(description) if description else None,
        }

        # אם העלו תמונה חדשה בעריכה
        if image and image.filename:
            file_bytes = await image.read()
            file_extension = image.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            bucket_name = "locations_images"

            supabase.storage.from_(bucket_name).upload(
                path=unique_filename,
                file=file_bytes,
                file_options={"content-type": image.content_type},
            )

            image_url = supabase.storage.from_(bucket_name).get_public_url(unique_filename)
            data_to_update["image_url"] = image_url

        response = (
            supabase.table("usersLocations")
            .update(data_to_update)
            .eq("id", location_id)
            .execute()
        )
        return {"success": True, "data": response.data}
    except Exception as e:
        print("!!! BACKEND UPDATE ERROR !!!:", str(e))
        raise HTTPException(
            status_code=400, detail=f"Database update crash: {str(e)}"
        )


# 🗑️ מחיקת מיקום לפי ID
@users_locations_router.delete("/delete/{location_id}")
def delete_users_location(location_id: int):
    """Deletes a location record by ID"""
    try:
        response = (
            supabase.table("usersLocations")
            .delete()
            .eq("id", location_id)
            .execute()
        )
        return {"success": True, "data": response.data}
    except Exception as e:
        print("!!! BACKEND DELETE ERROR !!!:", str(e))
        raise HTTPException(
            status_code=400, detail=f"Database delete crash: {str(e)}"
        )