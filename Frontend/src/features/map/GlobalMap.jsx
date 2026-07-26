import React, { useEffect, useState, useRef } from "react"
import { Map, Marker, Popup, Source, Layer, NavigationControl, GeolocateControl } from "react-map-gl/mapbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import { getGeneralData } from "../../api/general"
import Loading from "../../components/Loading"
import { useMap } from "../../context/mapContext"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

function GlobalMap() {
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
    handlSave,
  } = useMap()

  const mapRef = useRef(null)
  const [selectedLoc, setSelectedLoc] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const generalRes = await getGeneralData()
        const generalData = generalRes?.data?.data || generalRes?.data || []
        setLocations(generalData.map(loc => ({ ...loc, isCreatedByUser: false })))
      } catch (error) {
        console.error("שגיאה בטעינת המיקומים מהשרת:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setLocations, setLoading])

  useEffect(() => {
    if (userPosition?.latitude && userPosition?.longitude && mapRef.current) {
      mapRef.current.flyTo({
        center: [userPosition.longitude, userPosition.latitude],
        zoom: 14,
        essential: true,
        duration: 2500,
      })
    }
  }, [userPosition])

  useEffect(() => {
    try {
      findUserLocations()
    } catch (error) {
      console.log("location error", error)
    }
  }, [])

  if (loading) return <Loading />

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <style>{`
        @keyframes pulse-blue {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(26, 115, 232, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 14px rgba(26, 115, 232, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(26, 115, 232, 0); }
        }
        .user-gps-pulse { background: rgba(26, 115, 232, 0.25); border-radius: 50%; animation: pulse-blue 2s infinite; padding: 8px; display: inline-block; }
      `}</style>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken={MAPBOX_TOKEN}
        mapLib={mapboxgl}
        terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <GeolocateControl
          position="top-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          showUserLocation={false}
        />

        <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} />
        {skyLayer && <Layer {...skyLayer} />}

        {userPosition && (
          <Marker
            latitude={userPosition.latitude}
            longitude={userPosition.longitude}
            anchor="bottom"
            pitchAlignment="viewport"
            style={{ zIndex: 10005 }}
          >
            <div className="user-gps-pulse">
              <div style={{ fontSize: "34px", cursor: "pointer" }}>🚶‍♂️</div>
            </div>
          </Marker>
        )}

        {locations.map((loc, index) => {
          if (!loc.latitude || !loc.longitude) return null
          return (
            <Marker
              key={index}
              latitude={Number(loc.latitude)}
              longitude={Number(loc.longitude)}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation()
                setSelectedLoc(loc)
              }}
            >
              <div style={{ fontSize: "26px", cursor: "pointer" }}>💧</div>
            </Marker>
          )
        })}

        {selectedLoc && (
          <Popup
            latitude={Number(selectedLoc.latitude)}
            longitude={Number(selectedLoc.longitude)}
            anchor="top"
            onClose={() => setSelectedLoc(null)}
          >
            <div style={{ direction: "rtl", textAlign: "right", fontFamily: "sans-serif", padding: "5px", color: "#333" }}>
              <h3 style={{ margin: "0 0 5px 0", color: "#1a73e8", fontSize: "16px" }}>💧 {selectedLoc.name}</h3>
              <p style={{ margin: "5px 0", fontSize: "13px" }}>{selectedLoc.description || "אין תיאור"}</p>
              <div style={{ marginTop: "12px", borderTop: "1px solid #eee", paddingTop: "8px", display: "flex", gap: "10px" }}>
                <a
                  href={`https://google.com{selectedLoc.latitude},${selectedLoc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1a73e8", fontWeight: "bold", textDecoration: "none", fontSize: "13px" }}
                >
                  ניווט ➔
                </a>
                <button
                  onClick={() => handlSave(selectedLoc)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#1a73e8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  שמור מקום
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}

export default GlobalMap
