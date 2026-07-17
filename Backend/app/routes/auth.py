from fastapi import APIRouter, HTTPException, Body,Request, Depends,Response
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


SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def verify_supabase_user(request: Request) -> str:
    # 1. The browser automatically attaches cookies to the request
    # 'sb_access_token' is the standard name Supabase uses, or whatever name you choose when setting the cookie
    token = request.cookies.get("sb_access_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized: Missing session cookie")
    
    try:
        # 2. Validate the cookie token directly with Supabase
        user_response = supabase.auth.get_user(token)
        return user_response.user.id  # Returns the secure true user UUID string
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: Invalid cookie session ({str(e)})")



@auth_router.post("/register")
def register_user(user_data: UserAuthSchema, response: Response):  # 🌟 Added response object
    """הרשמת משתמש חדש במערכת של Supabase והתחברות אוטומטית בעוגייה"""
    try:
        # 1. קריאה לרישום המשתמש בסופאבייס
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        # 2. בדוק אם סופאבייס החזיר סשן פעיל מיד (קורה כשאישור מייל כבוי)
        if auth_response.session:
            token = auth_response.session.access_token
            
            # 3. ✨ שמירת הטוקן ישירות בתוך העוגיות של הדפדפן עבור הרישום
            response.set_cookie(
                key="sb_access_token",     
                value=token,
                httponly=True,             
                samesite="none",           # מאפשר העברה לפורט 5173
                secure=True,               # חובה כשמשתמשים ב-samesite="none"
                path="/"                   
            )
            
            return {
                "success": True,
                "message": "המשתמש נרשם ומחובר בהצלחה! ✨",
                "user": auth_response.user
            }
            
        # אם אישור מייל מופעל, פשוט נחזיר הודעה שהמשתמש צריך לאשר את המייל
        return {
            "success": True,
            "message": "המשתמש נרשם בהצלחה. יש לאשר את המייל כדי להתחבר. ✉️",
            "user": auth_response.user
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"שגיאה בהרשמה: {str(e)}")



@auth_router.post("/login")
def login_user(user_data: UserAuthSchema, response: Response):  # 2. INJECT response OBJECT HERE
    """התחברות משתמש קיים וקבלת Token מאובטח"""
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        token = auth_response.session.access_token
        
        # 3. ✨ שמירת הטוקן ישירות בתוך העוגיות (Cookies) של הדפדפן
        response.set_cookie(
            key="sb_access_token",     # חייב להתאים בדיוק למה שפונקצייתverify_supabase_user מחפשת!
            value=token,
            httponly=True,             # חוסם האקרים מלקרוא את הטוקן דרך JavaScript קליינט
            samesite="lax",            # נחוץ כדי שהעוגייה תעבור בין פורטים שונים בלוקאל-הוסט
            secure=False ,
            path="/"              # תשנה ל-True רק כשתעלה לשרת אמיתי עם HTTPS מאובטח
        )
        
        return {
            "success": True,
            "user": auth_response.user
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"פרטי התחברות שגויים או שגיאת מערכת: {str(e)}")
