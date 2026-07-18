import React, { useEffect, useState } from 'react';
import { Map, Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getUsersLocationsApi } from '../../api/general';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function UsersMap() {
  const [locations, setLocations] = useState([]);
  const [userPosition, setUserPosition] = useState(null); // סטייט חדש לשמירת המיקום העצמי של המשתמש
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

  // אפקט 1: משיכת מקורות המים מהדאטה-בייס של Supabase
  useEffect(() => {
    getUsersLocationsApi()
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

  // אפקט 2: שליפת מיקום ה-GPS של המשתמש וריכוז המפה סביבו
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // שמירת המיקום המדויק של המשתמש כדי להציג את הדמות שלו
          setUserPosition({ latitude, longitude });

          // המשתמש אישור שיתוף מיקום - מסיטים את המפה אליו בזום קרוב
          setViewState(prevState => ({
            ...prevState,
            latitude: latitude,
            longitude: longitude,
            zoom: 13 
          }));
        },
        (error) => {
          console.log("המשתמש סירב לשתף מיקום או שיש שגיאת רשת, נשארים עם מיקום ברירת המחדל.", error);
        }
      );
    }
  }, []); 

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
        mapLib={mapboxgl} 
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }} 
        style={{ width: '100%', height: '100%' }} 
      >
        <Source 
          id="mapbox-dem" 
          type="raster-dem" 
          url="mapbox://mapbox.mapbox-terrain-dem-v1" 
          tileSize={512} 
        />
        
        <Layer {...skyLayer} />

        {/* 🚀 הוספת מיקום עצמי בזמן אמת - מציג דמות של אדם מנווט */}
        {userPosition && (
          <Marker
            latitude={userPosition.latitude}
            longitude={userPosition.longitude}
            anchor="bottom"
            pitchAlignment="viewport"
            style={{ zIndex: 10005 }} // מבטיח שהדמות תצוף מעל פני השטח ההרריים והסיכות האחרות
          >
            <div style={{
              fontSize: '32px',
              filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))',
              cursor: 'pointer'
            }}
            title="המיקום הנוכחי שלך"
            >
              🚶‍♂️
            </div>
          </Marker>
        )}

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
              style={{ zIndex: 9999 }} 
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
            maxWidth="260px"
            style={{ zIndex: 10001 }} 
          >
            <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'sans-serif', padding: '5px', color: '#333' }}>
              {/* שם המקום */}
              <h3 style={{ margin: '0 0 5px 0', color: '#1a73e8', fontSize: '16px' }}>📍 {selectedLoc.name}</h3>
              
              {/* כתובת (אם קיימת) */}
              {selectedLoc.address && (
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  <strong>כתובת:</strong> {selectedLoc.address}
                </p>
              )}

              {/* תיאור / הערות (אם קיימים) */}
              {selectedLoc.description && (
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#555', lineHeight: '1.4' }}>
                  <strong>תיאור:</strong> {selectedLoc.description}
                </p>
              )}

              {/* השילוב של התמונה החדשה */}
              {selectedLoc.image_url && (
                <div style={{ marginTop: '10px', marginBottom: '5px', textAlign: 'center', width: '100%' }}>
                  <img 
                    src={selectedLoc.image_url} 
                    alt={selectedLoc.name} 
                    style={{ 
                      width: '100%', 
                      maxHeight: '130px', 
                      objectFit: 'cover', 
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }} 
                    onError={(e) => e.target.style.display = 'none'} 
                  />
                </div>
              )}
              
              {/* כפתור הניווט (תוקן) */}
              <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '8px', textAlign: 'left' }}>
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

export default UsersMap;
