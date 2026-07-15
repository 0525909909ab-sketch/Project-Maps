import React, { useEffect, useState } from 'react';
import { Map, Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getGeneralData, getUsersLocationsApi } from '../../api/general';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function GlobalMap() {
  const [locations, setLocations] = useState([]);
  const [userPosition, setUserPosition] = useState(null); // State mới lưu vị trí hiện tại của người dùng
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

  // אפקט 1: משיכת נתונים משתי הטבלאות במקביל (גוגל מפס הכללי + מיקומי משתמשים)
  useEffect(() => {
    Promise.all([getGeneralData(), getUsersLocationsApi()])
      .then(([generalRes, userRes]) => {
        let generalData = [];
        let userData = [];

        // חילוץ נתונים מטבלת גוגל הכללית
        if (generalRes?.data?.data) generalData = generalRes.data.data;
        else if (generalRes?.data && Array.isArray(generalRes.data)) generalData = generalRes.data;
        else if (Array.isArray(generalRes)) generalData = generalRes;

        // חילוץ נתונים מטבלת המיקומים של המשתמשים
        if (userRes?.data?.data) userData = userRes.data.data;
        else if (userRes?.data && Array.isArray(userRes.data)) userData = userRes.data;
        else if (Array.isArray(userRes)) userData = userRes;

        // הוספת סימון לכל מיקום של משתמש כדי שנדע להציג אותו בצורה שונה
        const formattedUserData = userData.map(loc => ({
          ...loc,
          isUserLocation: true // דגל שמזהה שזה מיקום שהתווסף ידנית על ידי משתמש
        }));

        // איחוד שני המערכים למערך אחד גדול עבור המפה
        setLocations([...generalData, ...formattedUserData]);
        setLoading(false);
      })
      .catch((error) => {
        console.error("שגיאה בטעינת המיקומים מהשרת:", error);
        setLoading(false);
      });
  }, []);

  // אפקט 2: שליפת מיקום ה-GPS של המשתמש, שמירתו בסטייט וריכוז המפה סביבו
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // שמירת המיקום המדויק של המשתמש בשביל להציג את הדמות שלו
          setUserPosition({ latitude, longitude });

          // מסיטים את המפה אליו בזום קרוב
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

        {/* 🚀 1. מיקום עצמי של המשתמש הנוכחי - מציג דמות של אדם מנווט */}
        {userPosition && (
          <Marker
            latitude={userPosition.latitude}
            longitude={userPosition.longitude}
            anchor="bottom"
            pitchAlignment="viewport"
            style={{ zIndex: 10005 }}
          >
            <div style={{
              fontSize: '32px',
              filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))',
              animation: 'bounce 2s infinite', // אופציונלי: הוספת אנימציית קפיצה עדינה לדמות
              cursor: 'pointer'
            }}
            title="המיקום הנוכחי שלך"
            >
              🚶‍♂️
            </div>
          </Marker>
        )}

        {/* 2. יצירת סיכות המיקומים על המפה (שילוב של שתי הטבלאות) */}
        {locations.map((loc) => {
          if (!loc.latitude || !loc.longitude) return null;

          // החלטה איזה אימוג'י להציג לפי סוג המיקום
          const icon = loc.isUserLocation ? "📍" : "💧";
          const markerKey = loc.isUserLocation ? `user-${loc.id}` : `gen-${loc.google_place_id || loc.id}`;

          return (
            <Marker
              key={markerKey}
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
                fontSize: loc.isUserLocation ? '28px' : '26px', // הבדל קטן בגודל במידת הצורך
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
                {icon}
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
              {/* כותרת משתנה לפי סוג המיקום */}
              <h3 style={{ margin: '0 0 5px 0', color: '#1a73e8', fontSize: '16px' }}>
                {selectedLoc.isUserLocation ? "📍" : "💧"} {selectedLoc.name}
              </h3>
              
              {selectedLoc.address && (
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  <strong>כתובת:</strong> {selectedLoc.address}
                </p>
              )}

              {/* תמיכה בהצגת תיאור של מיקומי משתמשים */}
              {selectedLoc.description && (
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#555', lineHeight: '1.4' }}>
                  <strong>תיאור:</strong> {selectedLoc.description}
                </p>
              )}

              {/* תמיכה בהצגת תמונה של מיקומי משתמשים במידה וקיימת */}
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
              
              <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '8px', textAlign: 'left' }}>
                <a 
href={`https://www.google.com/maps?q=${selectedLoc.latitude},${selectedLoc.longitude}`}                  rel="noopener noreferrer"
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
export default GlobalMap

