import React, { useEffect, useState } from 'react';
import { Map, Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getGeneralData } from '../../api/general';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function Map3D() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoc, setSelectedLoc] = useState(null);

  // הגדרות תצוגה ראשונית (ברירת מחדל אם המשתמש מסרב לשתף מיקום)
  const [viewState, setViewState] = useState({
    latitude: 32.8000,
    longitude: 35.5000,
    zoom: 11,
    pitch: 60, // זווית הטיית המצלמה לתצוגת תלת-ממד
    bearing: 0  
  });

  // אופקט 1: משיכת מקורות המים מהדאטה-בייס של Supabase
  useEffect(() => {
    getGeneralData()
      .then((response) => {
        if (response?.data?.data) {
          setLocations(response.data.data);
        } else if (response?.data && Array.isArray(response.data)) {
          setLocations(response.data);
        } else if (Array.isArray(response)) {
          setLocations(response);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("שגיאה בטעינת מקורות המים:", error);
        setLoading(false);
      });
  }, []);

  // אפקט 2: 🚀 שליפת מיקום ה-GPS של המשתמש וריכוז המפה סביבו
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // המשתמש אישר שיתוף מיקום - מסיטים את המפה אליו בזום קרוב
          setViewState(prevState => ({
            ...prevState,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            zoom: 13 
          }));
        },
        (error) => {
          console.log("המשתמש סירב לשתף מיקום או שיש שגיאת רשת, נשארים עם מיקום ברירת המחדל.", error);
        }
      );
    }
  }, []); // רץ פעם אחת מיד כשהמשתמש מנווט ומגיע לעמוד

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', direction: 'rtl' }}>
        טוען את מפת התלת-ממד...
      </div>
    );
  }

  // הגדרת שכבת אטמוספירת השמיים באופק
  const skyLayer = {
    id: 'sky',
    type: 'sky',
    paint: {
      'sky-type': 'atmosphere',
      'sky-atmosphere-sun': [0.0, 45.0],
      'sky-atmosphere-sun-intensity': 15
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-v9" 
        mapboxAccessToken={MAPBOX_TOKEN}
        mapLib={mapboxgl} // מקשר ישירות את המנוע על מנת למנוע שגיאות קריסה של תהליכונים
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }} // הפעלת פני שטח הרריים
        style={{ width: '100%', height: '100%' }} 
      >
        {/* הגדרת מקור פני השטח של המפה עבור התלת-ממד */}
        <Source 
          id="mapbox-dem" 
          type="raster-dem" 
          url="mapbox://mapbox.mapbox-terrain-dem-v1" 
          tileSize={512} 
        />
        
        <Layer {...skyLayer} />

        {/* יצירת סיכות הטיפה על המפה */}
        {locations.map((loc) => {
          if (!loc.latitude || !loc.longitude) return null;

          return (
            <Marker
              key={loc.google_place_id || loc.id}
              latitude={Number(loc.latitude)} 
              longitude={Number(loc.longitude)}
              anchor="bottom"
              pitchAlignment="viewport" 
              style={{ zIndex: 9999 }} // מונע מהאימוג'י להיבלע מתחת להרים התלת-ממדיים
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedLoc(loc);
              }}
            >
              <div style={{ 
                fontSize: '26px', 
                cursor: 'pointer', 
                filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))',
                transform: 'scale(1)',
                transition: 'transform 0.2s',
                position: 'relative',
                zIndex: 10000
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                💧
              </div>
            </Marker>
          );
        })}

        {/* חלונית פופאפ קופצת בלחיצה על סיכה */}
        {selectedLoc && (
          <Popup
            latitude={Number(selectedLoc.latitude)}
            longitude={Number(selectedLoc.longitude)}
            anchor="top"
            onClose={() => setSelectedLoc(null)}
            closeOnClick={false}
            maxWidth="300px"
            style={{ zIndex: 10001 }} // מבטיח שהפופאפ יצוף מעל שכבת האדמה והסיכות
          >
            <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'sans-serif', padding: '5px', color: '#333' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#1a73e8', fontSize: '16px' }}>📍 {selectedLoc.name}</h3>
              {selectedLoc.address && <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>כתובת:</strong> {selectedLoc.address}</p>}
              
              <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                <a 
                  href={`https://google.com{selectedLoc.latitude},${selectedLoc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1a73e8', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px', display: 'inline-block' }}
                >
                  ניווט ב-Google Maps ➔
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

export default Map3D;
