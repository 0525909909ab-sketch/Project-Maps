import os
from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, Request
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from pydantic import BaseModel
from supabase import create_client, Client
from app.routes.auth import verify_supabase_user

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
info_router = APIRouter(prefix="/usersInfo", tags=["Water Sources"])


class SaveLocationSchema(BaseModel):
    user_location_id: Optional[int] = None
    google_place_id: Optional[str] = None
    location_id: Optional[int] = None
    id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


def _resolve_user_id(request: Optional[Request], userId: Optional[str]) -> Optional[str]:
    if userId:
        return userId

    if request is None:
        return None

    try:
        current_user = verify_supabase_user(request)
        return getattr(current_user, "id", str(current_user))
    except HTTPException:
        return None


@info_router.get("/saveLocations")
def get_user_save_locations(
    userId: Optional[str] = Query(None),
    request: Request = None,
):
    current_user_id = _resolve_user_id(request, userId)
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized: missing user")
    try:
        response = supabase.table("saved_pins").select("id, created_at, user_id, user_location_id, google_place_id, latitude, longitude").eq("user_id", current_user_id).execute()
        items = response.data or []

        normalized = []
        for item in items:
            data = dict(item)
            location_ref = None

            if data.get("user_location_id") is not None:
                try:
                    location_res = supabase.table("usersLocations").select("id, name, latitude, longitude, description, image_url").eq("id", data["user_location_id"]).execute()
                    if location_res.data:
                        location_ref = location_res.data[0]
                except Exception:
                    location_ref = None

            if not location_ref and data.get("google_place_id"):
                location_ref = {
                    "id": None,
                    "name": data.get("google_place_id"),
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude"),
                    "description": None,
                    "image_url": None,
                }

            if location_ref:
                data["location"] = location_ref
            normalized.append(data)

        return {"success": True, "data": normalized}
    except Exception as e:
        print("--- SAVE LOCATIONS ERROR ---:", str(e))
        return {"success": True, "data": []}


@info_router.post("/addSaveLocations")
def add_user_save_location(
    payload: SaveLocationSchema,
    userId: Optional[str] = Query(None),
    request: Request = None,
):
    try:
        current_user_id = _resolve_user_id(request, userId)
        if not current_user_id:
            raise HTTPException(status_code=401, detail="Unauthorized: missing user")
        insert_data = {"user_id": current_user_id}

        if payload.user_location_id is not None:
            insert_data["user_location_id"] = payload.user_location_id
        elif payload.location_id is not None:
            insert_data["user_location_id"] = payload.location_id
        elif payload.id is not None:
            insert_data["user_location_id"] = payload.id

        # The favorites table in this project is currently used for coordinate-based saves.
        # Google Place IDs are not safely persisted for the current Supabase schema, so
        # we skip that field instead of crashing the insert.

        if payload.latitude is not None:
            insert_data["latitude"] = payload.latitude

        if payload.longitude is not None:
            insert_data["longitude"] = payload.longitude

        if not any(key in insert_data for key in ("google_place_id", "user_location_id", "latitude", "longitude")):
            raise HTTPException(status_code=400, detail="Missing a location identifier or coordinates")

        try:
            response = supabase.table("saved_pins").insert(insert_data).execute()
            return {"status": "success", "data": response.data}
        except Exception as e:
            error_text = str(e).lower()
            if "unique_user_pin" in error_text or "duplicate key" in error_text or "already exists" in error_text:
                return {"status": "already_exists", "data": []}
            if ("latitude" in error_text or "longitude" in error_text or "pgrst204" in error_text) and "latitude" in insert_data:
                insert_data.pop("latitude", None)
                insert_data.pop("longitude", None)
                response = supabase.table("saved_pins").insert(insert_data).execute()
                return {"status": "success", "data": response.data}
            raise
    except Exception as e:
        print("--- SUPABASE DATABASE CRASH DETAIL ---:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
