import React, { useEffect, useState, useRef, useMemo } from "react"
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from "react-map-gl/mapbox"
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
    loading,
    setLoading,
  } = useMap()

  const mapRef = useRef(null)
  const geolocateControlRef = useRef(null)
  const [publicLocations, setPublicLocations] = useState([])
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [activeFilter, setActiveFilter] = useState("all")

  const fetchGlobalData = async () => {
    try {
      setLoading(true)
      const publicRes = await getGeneralData()
      const pubRawData = publicRes?.data?.data || publicRes?.data?.locations || publicRes?.data || []
      const pubDataArray = Array.isArray(pubRawData) ? pubRawData : []
      
      setPublicLocations(pubDataArray)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGlobalData()
  }, [])

  const handleMapLoad = () => {
    if (geolocateControlRef.current) {
      geolocateControlRef.current.trigger()
    }
  }

  const filteredLocationsList = useMemo(() => {
    if (activeFilter === "public") {
      // מציג נקודות שהן מוגדרות כפומביות או שאין להן משתמש מקושר פרטי
      return publicLocations.filter(loc => loc.isPublic || loc.type === "public" || !loc.user_id)
    }
    return publicLocations
  }, [publicLocations, activeFilter])

  const renderedMarkers = useMemo(() => {
    return filteredLocationsList.map((loc, index) => {
      const lat = Number(loc.latitude || loc.lat)
      const lng = Number(loc.longitude || loc.lng)
      if (!lat || !lng) return null
      return (
        <Marker
          key={loc.id || loc._id || index}
          latitude={lat}
          longitude={lng}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation()
            setSelectedLoc(loc)
          }}
        >
          <div style={{ fontSize: "28px", cursor: "pointer", willChange: "transform" }}>💧</div>
        </Marker>
      )
    })
  }, [filteredLocationsList])

  if (loading) return <Loading />

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* בועות סינון (Filter Pills) */}
      <div style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10, display: "flex", gap: "8px", direction: "rtl" }}>
        <button 
          onClick={() => setActiveFilter("all")} 
          style={{ padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", backgroundColor: activeFilter === "all" ? "#007bff" : "rgba(255,255,255,0.9)", color: activeFilter === "all" ? "#fff" : "#333", fontWeight: "bold", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
        >
          הכל
        </button>
        <button 
          onClick={() => setActiveFilter("public")} 
          style={{ padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", backgroundColor: activeFilter === "public" ? "#007bff" : "rgba(255,255,255,0.9)", color: activeFilter === "public" ? "#fff" : "#333", fontWeight: "bold", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
        >
          פומביות בלבד
        </button>
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onLoad={handleMapLoad}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken={MAPBOX_TOKEN}
        mapLib={mapboxgl}
        reuseMaps
        terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-left" showCompass={false} />
        
        <GeolocateControl
          ref={geolocateControlRef}
          position="top-left"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          showUserLocation={true}
          showAccuracyCircle={true}
        />

        {renderedMarkers}

        {selectedLoc && (
          <Popup
            latitude={Number(selectedLoc.latitude || selectedLoc.lat)}
            longitude={Number(selectedLoc.longitude || selectedLoc.lng)}
            anchor="top"
            onClose={() => setSelectedLoc(null)}
            closeOnClick={false}
          >
            <div style={{ direction: "rtl", padding: "5px", minWidth: "150px" }}>
              <h3 style={{ margin: "0 0 5px 0" }}>{selectedLoc.name || selectedLoc.title || "נקודה ללא שם"}</h3>
              {selectedLoc.description && <p style={{ margin: "0 0 10px 0", fontSize: "14px" }}>{selectedLoc.description}</p>}
              {selectedLoc.image_url && <img src={selectedLoc.image_url} alt={selectedLoc.name} style={{ width: "100%", maxHeight: "100px", objectFit: "cover", borderRadius: "4px", marginBottom: "10px" }} />}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}

export default GlobalMap