import os
from fastapi import FastAPI, APIRouter, HTTPException, Query,Depends
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from app.core.confing import settings
from pydantic import BaseModel
from supabase import create_client, Client
from app.routes.auth import verify_supabase_user
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY
class SaveLocationSchema(BaseModel):
    user_location_id: Optional[int] = None
    google_place_id: Optional[str] = None


supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

info_router = APIRouter(prefix="/usersInfo", tags=["Water Sources"])

@info_router.get("/saveLocations")
def get_user_save_locations(current_user_id: str = Depends(verify_supabase_user)):
    try:    
        # We select both potential relation columns and their joined tables
        response = (
            supabase.table("saved_pins")
            .select('''
                id, 
                created_at, 
                user_location_id,
                google_place_id,
                usersLocations (id, name, latitude, longitude),
                locations(address, latitude, longitude)
            ''')
            .eq("user_id", current_user_id)
            .execute()
        )
        
        return response.data

    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
@info_router.post("/addSaveLocations")
def add_user_save_location(payload: SaveLocationSchema, current_user_id: str = Depends(verify_supabase_user)):
    try:    
        # Build the exact row data container to send to Supabase
        insert_data = {"user_id": current_user_id}
        
        # Check which ID type the frontend sent and assign it to the matching column
        if payload.user_location_id is not None:
            insert_data["user_location_id"] = payload.user_location_id
        elif payload.google_place_id is not None:
            insert_data["google_place_id"] = payload.google_place_id
        else:
            raise HTTPException(status_code=400, detail="Missing a location identifier")

        # Execute the database insertion query
        response = (
            supabase.table("saved_pins")
            .insert(insert_data)
            .execute()
        )
        return {"status": "success", "data": response.data}

    except Exception as e:
         # 🌟 CRITICAL: This allows you to read the exact Supabase database error message in your console!
         print("--- SUPABASE DATABASE CRASH DETAIL ---:", str(e))
         raise HTTPException(status_code=500, detail=str(e))