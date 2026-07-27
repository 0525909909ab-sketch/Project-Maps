from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Query
from typing import Optional
from pydantic import BaseModel
from app.core.config import settings
from supabase import create_client, Client
import uuid

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
users_locations_router = APIRouter(prefix="/userslocations", tags=["Users Locations"])


class LocationSchema(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float


class GlobalShareSchema(BaseModel):
    target_identifier: str


@users_locations_router.get("/getAll")
def get_all_users_locations(user_id: str = Query(...)):
    try:
        my_pins_res = (
            supabase.table("usersLocations")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        my_pins = my_pins_res.data if my_pins_res.data else []
    except Exception:
        my_pins = []

    try:
        shared_by_res = (
            supabase.table("map_members")
            .select("map_id")
            .eq("user_id", user_id)
            .execute()
        )
        allowed_owners = [
            item["map_id"] for item in (shared_by_res.data or []) if item.get("map_id") is not None
        ]
    except Exception:
        allowed_owners = []

    shared_pins = []
    if allowed_owners:
        try:
            shared_pins_res = (
                supabase.table("usersLocations")
                .select("*")
                .in_("user_id", allowed_owners)
                .execute()
            )
            shared_pins = shared_pins_res.data if shared_pins_res.data else []
        except Exception:
            shared_pins = []

    all_accessible_pins = my_pins + shared_pins
    seen_ids = set()
    unique_pins = []
    for pin in all_accessible_pins:
        pin_id = pin.get("id")
        if pin_id is not None and pin_id not in seen_ids:
            seen_ids.add(pin_id)
            unique_pins.append(pin)

    return {"success": True, "data": unique_pins}


@users_locations_router.get("/saveLocations")
def get_saved_locations(user_id: str = Query(...)):
    try:
        saved_res = (
            supabase.table("saved_pins")
            .select("location_id")
            .eq("user_id", user_id)
            .execute()
        )
        saved_data = saved_res.data if saved_res.data else []
        location_ids = [row["location_id"] for row in saved_data]

        if not location_ids:
            return {"success": True, "data": []}

        locations_res = (
            supabase.table("usersLocations")
            .select("*")
            .in_("id", location_ids)
            .execute()
        )
        return {"success": True, "data": locations_res.data if locations_res.data else []}
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Database fetch crash: {str(e)}"
        )


@users_locations_router.post("/add")
async def add_users_location(
    user_id: str = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: Optional[UploadFile] = File(None),
):
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
            image_url = supabase.storage.from_(bucket_name).get_public_url(
                unique_filename
            )

        data = {
            "user_id": user_id,
            "isUserLocation": True,
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


@users_locations_router.post("/permissions/grant")
def grant_global_permission(schema: GlobalShareSchema, current_user_id: str):
    try:
        target_user_id = schema.target_identifier
        if "@" in schema.target_identifier:
            user_res = (
                supabase.table("users")
                .select("id")
                .eq("email", schema.target_identifier)
                .execute()
            )
            if not user_res.data:
                raise HTTPException(
                    status_code=404,
                    detail="משתמש עם אימייל זה לא נמצא במערכת"
                )
            target_user_id = user_res.data["id"]

        permission_data = {
            "map_id": current_user_id,
            "user_id": target_user_id,
        }
        res = supabase.table("map_members").insert(permission_data).execute()
        return {
            "success": True,
            "message": "הגישה שותפה בהצלחה",
            "data": res.data,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@users_locations_router.get("/permissions/list")
def list_my_granted_permissions(user_id: str):
    try:
        res = (
            supabase.table("map_members")
            .select("id, user_id")
            .eq("map_id", user_id)
            .execute()
        )
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@users_locations_router.delete("/permissions/revoke/{permission_id}")
def revoke_global_permission(permission_id: int):
    try:
        res = (
            supabase.table("map_members")
            .delete()
            .eq("id", permission_id)
            .execute()
        )
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@users_locations_router.put("/update/{location_id}")
async def update_users_location(
    location_id: int,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    try:
        data_to_update = {
            "name": str(name),
            "description": str(description) if description else None,
        }
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
            image_url = supabase.storage.from_(bucket_name).get_public_url(
                unique_filename
            )
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


@users_locations_router.delete("/delete/{location_id}")
def delete_users_location(location_id: int):
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
