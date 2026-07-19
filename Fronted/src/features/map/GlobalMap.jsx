import React, { useEffect, useState } from 'react';
import { Map, Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getGeneralData, getUsersLocationsApi } from '../../api/general';
import mapboxgl from 'mapbox-gl';
import { addUsersSaveLocationApi } from '../../api/info';
import Loading from '../../components/Loading';
import { useAuth } from '../../context/authContext';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function GlobalMap({ showOnlyUserLocations = false }) { 
  // 1. שלופים את כל המצב הגלובלי מה-Context שלכם
  const {
    viewState, 
    setViewState,
    locations,
    setLocations,
    loading,
    setLoading,
    findUserLocations,
    userPosition,
    skyLayer,
    pinnedLocation,    
    setPinnedLocation,
    handlSave
  } = useAuth();  

  const [selectedLoc, setSelectedLoc] = useState(null);

  const handleMapClick = (event) => {
    const lngLat = event.lngLat; 
    if (lngLat) {
      setPinnedLocation({
        latitude: lngLat.lat,
        longitude: lngLat.lng
      });
    }
  };
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (showOnlyUserLocations) {
        const userRes = await getUsersLocationsApi();
        const userData =  userRes?.data || userRes || [];
        
        setLocations(userData.map(loc => ({ ...loc, isCreatedByUser: true })));
      } 
      else {
        const [generalRes, userRes] = await Promise.all([
          getGeneralData(), 
          getUsersLocationsApi() 
        ]);

        const generalData = generalRes?.data?.data  || [];
        const userData = userRes?.data || userRes || [];

        const userGeneratedLocations = userData.map(loc => ({ ...loc, isCreatedByUser: true }));
        
        setLocations([...generalData, ...userGeneratedLocations]);
      }
    } catch (error) {
      console.error("שגיאה בטעינת המיקומים מהשרת:", error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, [showOnlyUserLocations, setLocations, setLoading]);



  useEffect(() => {
    try {
      findUserLocations();
    } catch (error) {
      console.log("location error", error);
    }
  }, []); 

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        {...viewState}
        onClick={handleMapClick}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-v9" 
        mapboxAccessToken={MAPBOX_TOKEN}
        mapLib={mapboxgl} 
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }} 
        style={{ width: '100%', height: '100%' }} 
      >
        
        {pinnedLocation && (
          <Marker latitude={pinnedLocation.latitude} longitude={pinnedLocation.longitude}>
            <div style={{ color: 'red', fontSize: '32px', cursor: 'pointer', animation: 'bounce 0.5s ease' }}>📍</div>
          </Marker>
        )}

        <Source 
          id="mapbox-dem" 
          type="raster-dem" 
          url="mapbox://mapbox.mapbox-terrain-dem-v1" 
          tileSize={512} 
        />
        
        {skyLayer && <Layer {...skyLayer} />}

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
              cursor: 'pointer'
            }}
      
            >
              🚶‍♂️
            </div>
          </Marker>
        )}

        {locations.map((loc, index) => {
          if (!loc.latitude || !loc.longitude) return null;

          const icon = loc.isCreatedByUser ? "📍" : "💧";
          const markerKey = loc.isCreatedByUser ? `user-${loc.id || index}` : `gen-${loc.google_place_id || loc.id || index}`;

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
                fontSize: loc.isCreatedByUser ? '28px' : '26px', 
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
              <h3 style={{ margin: '0 0 5px 0', color: '#1a73e8', fontSize: '16px' }}>
                {selectedLoc.isCreatedByUser ? "📍" : "💧"} {selectedLoc.name}
              </h3>
              
              {selectedLoc.address && (
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  <strong>כתובת:</strong> {selectedLoc.address}
                </p>
              )}

              {selectedLoc.description && (
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#555', lineHeight: '1.4' }}>
                  <strong>תיאור:</strong> {selectedLoc.description}
                </p>
              )}

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
              
              <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a 
                  href={`https://www.google.com/maps?q=${selectedLoc.latitude},${selectedLoc.longitude}`}                  
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1a73e8', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' }}
                >
                  ניווט ➔
                </a>
                
                <button  
                  onClick={() => handlSave(selectedLoc)}
                  style={{ padding: '4px 8px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                  שמור מקום
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

export default GlobalMap;
