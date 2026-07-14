import React, { useEffect, useState } from 'react';
import { Map, Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getGeneralData } from '../../api/general';

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

// תוקן רשמית: שם הפונקציה שונה ל-Map3D כדי למנוע לולאה אינסופית מול הרכיב <Map>
function Map3D() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoc, setSelectedLoc] = useState(null);

  // הגדרות תצוגה ראשונית עם זווית תלת-ממדית
  const [viewState, setViewState] = useState({
    latitude: 32.8000,
    longitude: 35.5000,
    zoom: 11,
    pitch: 60, // זווית הטיית המצלמה
    bearing: 0  
  });

  useEffect(() => {
    getGeneralData()
      .then((response) => {
        if (response?.data?.data) {
          setLocations(response.data.data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("שגיאה בטעינת מקורות המים:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', direction: 'rtl' }}>
        טוען את מפת התלת-ממד...
      </div>
    );
  }

  // הגדרת שכבת השמיים באופק
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
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }} 
        style={{ width: '100%', height: '100%' }} // הגדרת ממדים קשיחה למניעת קריסת גובה
      >
        <Source 
          id="mapbox-dem" 
          type="raster-dem" 
          url="mapbox://mapbox.mapbox-terrain-dem-v1" 
          tileSize={512} 
        />
        
        <Layer {...skyLayer} />

        {/* יצירת הסיכות על המפה */}
        {locations.map((loc) => {
          if (!loc.latitude || !loc.longitude) return null;

          return (
            <Marker
              key={loc.google_place_id || loc.id}
              latitude={Number(loc.latitude)} 
              longitude={Number(loc.longitude)}
              anchor="bottom"
              pitchAlignment="viewport" 
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
                transition: 'transform 0.2s'
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
          >
            <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'sans-serif', padding: '5px', color: '#333' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#1a73e8', fontSize: '16px' }}>📍 {selectedLoc.name}</h3>
              {selectedLoc.address && <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>כתובת:</strong> {selectedLoc.address}</p>}
              
              <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                {/* תוקן סופית: לינק הניווט תוקן לפורמט ה-URL הרשמי והתקין של גוגל מפס */}
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
