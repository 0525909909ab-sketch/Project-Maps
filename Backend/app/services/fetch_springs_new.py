import os
import sys
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
from dotenv import load_dotenv
env_path = os.path.join(backend_path, ".env")
load_dotenv(dotenv_path=env_path)

import requests
from supabase import create_client, Client
from app.core.confing import settings
import time

# שליפת המפתחות ישירות מההגדרות של האפליקציה שלך
GOOGLE_API_KEY = settings.GOOGLE_API_KEY
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY

# יצירת ה-Client של סופאבייס
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SEARCH_QUERIES = ["מעיין", "נחל", "גב מים", "בריכת מים", "spring israel", "river israel"]

def fetch_places_for_query(query):
    # כתובת ה-API הרשמית והנכונה של גוגל (Places API New)
    url = "https://places.googleapis.com/v1/places:searchText"    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.photos,nextPageToken"
    }
    
    saved_count = 0
    next_page_token = None
    
    while True:
        # בניית הבקשה הבסיסית שתמיד חייבת להישלח במלואה לגוגל
        data = {
            "textQuery": query,
            "languageCode": "he",
            "pageSize": 20,
            "locationRestriction": {
                "rectangle": {
                    "low": {"latitude": 29.4, "longitude": 34.2},
                    "high": {"latitude": 33.4, "longitude": 35.9}
                }
            }
        }
        
        # אם אנחנו בעמוד שני ומעלה, מוסיפים את ה-Token מבלי למחוק את הפרמטרים המקוריים
        if next_page_token:
            data["pageToken"] = next_page_token
            
        
            
        try:
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code != 200:
                print(f"שגיאה מגוגל עבור '{query}': סטטוס {response.status_code} - {response.text}")
                break
                
            res_json = response.json()
            places = res_json.get("places", [])
            
            for place in places:
                place_id = place.get("id")
                if not place_id:
                    continue
                    
                display_name = place.get("displayName", {}).get("text", "מעיין לא מוכר")
                address = place.get("formattedAddress", "")
                location_data = place.get("location", {})
                
                # --- לוגיקת חילוץ תמונות תקינה ובטוחה מגוגל קלאוד ---
                image_url = None
                photos = place.get("photos", [])
                if isinstance(photos, list) and len(photos) > 0:
                    first_photo = photos[0]  # שליפת האיבר הראשון ברשימה בצורה תקינה
                    if isinstance(first_photo, dict):
                        photo_name = first_photo.get("name") # מחזיר מחרוזת במבנה: places/PLACE_ID/photos/PHOTO_ID
                        if photo_name:
                            # בניית ה-URL התקני לשליפת המדיה הישירה של התמונה
                            image_url = f"https://googleapis.com{photo_name}/media?maxHeightPx=400&maxWidthPx=400&key={GOOGLE_API_KEY}"
                
                # התאמה מדויקת לעמודות של הדאטה בייס שלך (כולל title)
                spring_data = {
                    "title": display_name,
                    "address": address,
                    "google_place_id": place_id,
                    "latitude": location_data.get("latitude"),
                    "longitude": location_data.get("longitude"),
                    "image_url": image_url
                }
                
                if spring_data["latitude"] is None or spring_data["longitude"] is None:
                    continue
                    
                try:
                    # ביצוע upsert מול Supabase המבוסס על ה-Unique Key של גוגל
                    supabase.table("locations").upsert(spring_data, on_conflict="google_place_id").execute()
                    saved_count += 1
                except Exception as e:
                    print(f"שגיאה בשמירת {spring_data['title']}: {e}")
                    
            # בדיקה האם יש דף תוצאות נוסף
            next_page_token = res_json.get("nextPageToken")
            if not next_page_token:
                break
                
            # גוגל דורשת השהייה קלה בין בקשות דפים (Pagination) כדי למנוע חסימות
            time.sleep(1.5)
            
        except Exception as e:
            print(f"שגיאת רשת עבור '{query}': {e}")
            break
            
    print(f"סיימנו את השאילתה '{query}'. נשמרו/עודכנו {saved_count} מקומות.")

def run_fetch():
    print("מתחיל איסוף נתוני מקורות מים בישראל עם תמונות...")
    for query in SEARCH_QUERIES:
        print(f"מריץ חיפוש עבור: {query}")
        fetch_places_for_query(query)
    print("התהליך הסתיים בהצלחה עבור כל השאילתות!")

if __name__ == "__main__":
    run_fetch()
