from fastapi import APIRouter, HTTPException, Body, Request, Depends, Response
from pydantic import BaseModel, EmailStr
from app.core.config import settings
from supabase import create_client, Client

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY  # כאן חובה להשתמש במפתח ה-anon/public!

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


# הגדרת מבנה הנתונים שמצפים לקבל מהפרונטאנד
class UserAuthSchema(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str


def verify_supabase_user(request: Request) -> str:
    # 1. The browser automatically attaches cookies to the request
    # 'sb_access_token' is the standard name Supabase uses, or whatever name you choose when setting the cookie
    token = request.cookies.get("sb_access_token")

    if not token:
        raise HTTPException(
            status_code=401, detail="Unauthorized: Missing session cookie"
        )

    try:
        # 2. Validate the cookie token directly with Supabase
        user_response = supabase.auth.get_user(token)
        return (
            user_response.user
        )  # Returns user -> user.id returns the secure true user UUID string

    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Unauthorized: Invalid cookie session ({str(e)})"
        )


@auth_router.post("/register")
def register_user(
    user_data: UserAuthSchema, response: Response
):  # 🌟 Added response object
    """הרשמת משתמש חדש במערכת של Supabase והתחברות אוטומטית בעוגייה"""
    try:
        # 1. קריאה לרישום המשתמש בסופאבייס (Inner/hidden supabase authorization system)
        auth_response = supabase.auth.sign_up(
            {"email": user_data.email, "password": user_data.password}
        )

        # USERS הוספת המשתמש לטבלה הציבורית שלנו
        # In case registration is successful, record user into the table: USERS
        if auth_response.user:
            supabase.table("users").insert(
                {
                    "Username": user_data.name,
                    "Gmail": user_data.email,
                    # id (int8) & created_at - DB fill automatically.
                }
            ).execute()

        # 2. בדוק אם סופאבייס החזיר סשן פעיל מיד
        if auth_response.session:
            token = auth_response.session.access_token

            # 3. ✨ שמירת הטוקן ישירות בתוך העוגיות של הדפדפן עבור הרישום
            response.set_cookie(
                key="sb_access_token",
                value=token,
                httponly=True,
                samesite="none",  # מאפשר העברה לפורט 5173
                secure=True,  # חובה כשמשתמשים ב-samesite="none"
                path="/",
            )

            return {
                "success": True,
                "message": "המשתמש נרשם ומחובר בהצלחה! ✨",
                "user": auth_response.user,
            }

        # אם אישור מייל מופעל, פשוט נחזיר הודעה שהמשתמש צריך לאשר את המייל
        return {
            "success": True,
            "message": "המשתמש נרשם בהצלחה. יש לאשר את המייל כדי להתחבר. ✉️",
            "user": auth_response.user,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"שגיאה בהרשמה: {str(e)}")


@auth_router.post("/login")
def login_user(
    user_data: UserLoginSchema, response: Response
):  # 2. INJECT response OBJECT HERE
    """התחברות משתמש קיים וקבלת Token מאובטח"""
    try:
        auth_response = supabase.auth.sign_in_with_password(
            {"email": user_data.email, "password": user_data.password}
        )

        token = auth_response.session.access_token

        # 3. ✨ שמירת הטוקן ישירות בתוך העוגיות (Cookies) של הדפדפן
        response.set_cookie(
            key="sb_access_token",  # חייב להתאים בדיוק למה שפונקצייתverify_supabase_user מחפשת!
            value=token,
            httponly=True,  # חוסם האקרים מלקרוא את הטוקן דרך JavaScript קליינט
            samesite="none",  # נחוץ כדי שהעוגייה תעבור בין פורטים שונים בלוקאל-הוסט
            secure=True,  # חובה כשמשתמשים ב-samesite="none"
            path="/",  # תשנה ל-True רק כשתעלה לשרת אמיתי עם HTTPS מאובטח
        )

        return {"success": True, "user": auth_response.user}
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"פרטי התחברות שגויים או שגיאת מערכת: {str(e)}"
        )


@auth_router.get("/me")
def get_current_user(user=Depends(verify_supabase_user)):
    """
    Endpoint for Redux session recovery.
    Checks cookies and returns user profile.
    """
    try:
        # Get name from users table
        # by using email from  checked token
        db_response = (
            supabase.table("users").select("Username").eq("Gmail", user.email).execute()
        )

        # If we found a name in DB — use it, otherwise set a placeholder
        name = db_response.data[0]["Username"] if db_response.data else "User"

        return {
            "success": True,
            "user": {"id": user.id, "email": user.email, "name": name},
        }
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error No user profile data accepted: {str(e)}"
        )


@auth_router.post("/logout")
def logout_user(response: Response):
    """
    Endpoint for logout. Destroys the cookie in the user's browser.
    """
    response.delete_cookie(
        key="sb_access_token",
        path="/",
        httponly=True,
        samesite="none",
        secure=True,
    )
    return {
        "success": True,
        "message": "You have successfully logged out of the system",
    }
