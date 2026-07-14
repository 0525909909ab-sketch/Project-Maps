from fastapi import APIRouter, HTTPException
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

@users_locations_router.get("/get-all")
def get_all_users_locations():
    """Fetches all custom records from the usersLocations table"""
    try:
        # REMOVED internal double quotes: changed '"usersLocations"' to "usersLocations"
        response = supabase.table("usersLocations").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database fetch crash: {str(e)}")

@users_locations_router.post("/add")
def add_users_location(location: LocationSchema):
    """Inserts a new user coordinate entry into the database"""
    try:
        data = {
            "name": str(location.name),
            "description": str(location.description) if location.description else None,
            "latitude": float(location.latitude),
            "longitude": float(location.longitude)
        }
        
        # REMOVED internal double quotes: changed '"usersLocations"' to "usersLocations"
        response = supabase.table("usersLocations").insert(data).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        print("!!! BACKEND DATABASE ERROR DETAILS !!!:", str(e))
        raise HTTPException(status_code=400, detail=f"Database insertion crash: {str(e)}")
