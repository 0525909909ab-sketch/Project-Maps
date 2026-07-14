from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, EmailStr
from app.core.confing import settings
from supabase import create_client, Client

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY # כאן חובה להשתמש במפתח ה-anon/public!

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

# הגדרת מבנה הנתונים שמצפים לקבל מהפרונטאנד
class UserAuthSchema(BaseModel):
    email: EmailStr
    password: str

@auth_router.post("/register")
def register_user(user_data: UserAuthSchema):
    """הרשמת משתמש חדש במערכת של Supabase"""
    try:
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        return {
            "success": True,
            "message": "המשתמש נרשם בהצלחה. יש לאשר את המייל במידת הצורך.",
            "user": response.user
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"שגיאה בהרשמה: {str(e)}")

@auth_router.post("/login")
def login_user(user_data: UserAuthSchema):
    """התחברות משתמש קיים וקבלת Token מאובטח"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        return {
            "success": True,
            "token": response.session.access_token,
            "user": response.user
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"פרטי התחברות שגויים או שגיאת מערכת: {str(e)}")
