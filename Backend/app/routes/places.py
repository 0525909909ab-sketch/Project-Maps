from fastapi import APIRouter, HTTPException

# import DB client
from app.core.db import supabase

water_router = APIRouter(prefix="/places", tags=["Water Sources"])


@water_router.get("/")
def get_all_water_sources():
    try:
        # Query Supabase and fetch all records from the 'locations' table
        response = supabase.table("locations").select("*").execute()

        # The clean data is located inside response.data as a list of dictionaries
        all_sources = response.data

        # Return the data as a JSON response to the frontend
        return {"success": True, "count": len(all_sources), "data": all_sources}

    except Exception as e:
        # In case of a database error, return a structured error to the frontend
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")
