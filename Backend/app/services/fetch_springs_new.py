import os
import requests
from supabase import create_client, Client
from app.core.confing import settings
import time


GOOGLE_API_KEY=settings.GOOGLE_API_KEY
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SEARCH_QUERIES = ["מעיין", "נחל", "גב מים", "בריכת מים", "spring israel", "river israel"]

def fetch_places_for_query(query):
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        # חובה להוסיף nextPageToken ל-FieldMask כדי לאפשר דפדוף
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,nextPageToken"
    }
    
    saved_count = 0
    next_page_token = None
    
    while True:
        data = {
            "textQuery": query,
            "languageCode": "he", # עדיף עברית עבור מקומות בישראל
            "pageSize": 20, # מקסימום תוצאות לעמוד ב-API החדש
            "locationRestriction": {
                "rectangle": {
                    "low": {"latitude": 29.4, "longitude": 34.2},
                    "high": {"latitude": 33.4, "longitude": 35.9}
                }
            }
        }
        
        # אם יש טוקן לעמוד הבא, נוסיף אותו לבקשה
        if next_page_token:
            data["pageToken"] = next_page_token
            
        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code != 200:
                print(f"שגיאה מגוגל עבור '{query}': סטטוס {response.status_code}")
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
                
                spring_data = {
                    "name": display_name,
                    "address": address,
                    "google_place_id": place_id,
                    "latitude": location_data.get("latitude"),
                    "longitude": location_data.get("longitude")
                }
                
                if spring_data["latitude"] is None or spring_data["longitude"] is None:
                    continue
                    
                try:
                    # שימוש ב-upsert מונע כפילויות אם מקום עולה בכמה שאילתות
                    supabase.table("locations").upsert(spring_data, on_conflict="google_place_id").execute()
                    saved_count += 1
                except Exception as e:
                    print(f"שגיאה בשמירת {spring_data['name']}: {e}")
            
            # בדיקה אם יש עמוד תוצאות נוסף
            next_page_token = res_json.get("nextPageToken")
            if not next_page_token:
                break # אין יותר תוצאות לשאילתה זו
                
            time.sleep(1) # השהייה קלה בין עמודים כדי לא להיחסם
            
        except Exception as e:
            print(f"שגיאת רשת עבור '{query}': {e}")
            break
            
    print(f"סיימנו את השאילתה '{query}'. נשמרו/עודכנו {saved_count} מקומות.")

def run_fetch():
    print("מתחיל איסוף נתוני מקורות מים בישראל...")
    for query in SEARCH_QUERIES:
        print(f"מריץ חיפוש עבור: {query}")
        fetch_places_for_query(query)
    print("התהליך הסתיים בהצלחה עבור כל השאילתות!")

if __name__ == "__main__":
    run_fetch()