import React, { useEffect, useState, useRef, useMemo } from "react"
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from "react-map-gl/mapbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useSelector } from "react-redux"

import { getUsersLocationsApi, addUsersLocationApi, updateUsersLocationApi, deleteUsersLocationApi, getGeneralData } from "../../api/general"
import Loading from "../../components/Loading"
import { useMap } from "../../context/mapContext"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

function UsersMap() {
  const {
    viewState,
    setViewState,
    locations,
    setLocations,
    loading,
    setLoading,
    findUserLocations,
    pinnedLocation,
    setPinnedLocation,
  } = useMap()

  const currentUser = useSelector(state => state.user?.userInfo || state.user?.user || state.user || state.user?.currentUser)
  const userId = currentUser?.id || currentUser?.uid || currentUser?._id || currentUser?.userId || currentUser?.email || currentUser?.name

  const mapRef = useRef(null)
  const geolocateControlRef = useRef(null)
  const pressTimerRef = useRef(null)
  const startCoordsRef = useRef({ x: 0, y: 0 })

  const [publicLocations, setPublicLocations] = useState([])
  const [activeFilter, setActiveFilter] = useState("all") 
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [showAddPrompt, setShowAddPrompt] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formImage, setFormImage] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const publicRes = await getGeneralData()
      const pubRawData = publicRes?.data?.data || publicRes?.data?.locations || publicRes?.data || []
      const pubDataArray = Array.isArray(pubRawData) ? pubRawData : []
      setPublicLocations(pubDataArray.map(loc => ({ ...loc, isPublic: true, isCreatedByUser: false })))

      if (userId) {
        const userRes = await getUsersLocationsApi(userId)
        const userData = userRes?.data?.data || userRes?.data || userRes || []
        const userArray = Array.isArray(userData) ? userData : []
        setLocations(userArray.map(loc => ({ ...loc, isCreatedByUser: true, isPublic: false })))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [userId])

  const handleMapLoad = () => {
    setTimeout(() => {
      if (geolocateControlRef.current) {
        geolocateControlRef.current.trigger()
      }
    }, 500)
  }

  const handleTouchStart = e => {
    const mapInstance = mapRef.current?.getMap()
    if (!mapInstance || !e.point) return

    startCoordsRef.current = { x: e.point.x, y: e.point.y }

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current)

    pressTimerRef.current = setTimeout(() => {
      const lngLat = mapInstance.unproject([e.point.x, e.point.y])
      if (lngLat && lngLat.lng !== undefined && lngLat.lat !== undefined) {
        setPinnedLocation({ latitude: lngLat.lat, longitude: lngLat.lng })
        setShowAddPrompt(true)
        setSelectedLoc(null)
      }
    }, 600)
  }

  const handleTouchMove = e => {
    if (!e.point) return
    const dx = Math.abs(e.point.x - startCoordsRef.current.x)
    const dy = Math.abs(e.point.y - startCoordsRef.current.y)
    if (dx > 8 || dy > 8) {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current)
        pressTimerRef.current = null
      }
    }
  }

  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  const openAddModal = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormName("")
    setFormDesc("")
    setFormImage(null)
    setShowModal(true)
  }

  const openEditModal = loc => {
    setIsEditing(true)
    setEditingId(loc.id || loc._id)
    setFormName(loc.name || "")
    setFormDesc(loc.description || "")
    setFormImage(null)
    setShowModal(true)
    setSelectedLoc(loc)
  }

  const handleModalSubmit = async () => {
    if (!formName || !formName.trim()) {
      alert("נא להזין שם למקום")
      return
    }

    if (!userId) {
      alert("שגיאה: משתמש לא מזוהה (חסר מזהה משתמש)")
      return
    }

    try {
      if (isEditing) {
        const formData = new FormData()
        formData.append("name", formName.trim())
        formData.append("description", formDesc.trim())
        if (formImage) {
          formData.append("image", formImage)
        }

        const response = await updateUsersLocationApi(editingId, formData)
        const updatedData = response?.data?.data || response?.data

        setLocations(prev =>
          prev.map(loc => {
            if ((loc.id || loc._id) === editingId) {
              return {
                ...loc,
                name: formName.trim(),
                description: formDesc.trim(),
                image_url: updatedData?.image_url || loc.image_url,
              }
            }
            return loc
          }),
        )
      } else {
        if (!pinnedLocation) {
          alert("נא לבחור נקודה על המפה תחילה")
          return
        }
        
        const formData = new FormData()
        formData.append("user_id", String(userId))
        formData.append("name", formName.trim())
        formData.append("description", formDesc ? formDesc.trim() : "")
        formData.append("latitude", String(pinnedLocation.latitude))
        formData.append("longitude", String(pinnedLocation.longitude))
        if (formImage) formData.append("image", formImage)

        const response = await addUsersLocationApi(formData)
        const newLoc = response?.data?.data || response?.data || response

        if (newLoc) {
          const formattedLoc = {
            ...newLoc,
            name: formName.trim(),
            description: formDesc ? formDesc.trim() : "",
            image_url: newLoc.image_url || null,
            latitude: Number(newLoc.latitude || pinnedLocation.latitude),
            longitude: Number(newLoc.longitude || pinnedLocation.longitude),
            id: newLoc.id || newLoc._id || Date.now(),
            isCreatedByUser: true,
            isPublic: false
          }
          setLocations(prev => [...prev, formattedLoc])
        }
      }

      setShowModal(false)
      setShowAddPrompt(false)
      setPinnedLocation(null)
      setSelectedLoc(null)
      setFormName("")
      setFormDesc("")
      setFormImage(null)
      alert("המיקום נשמר בהצלחה!")
      
      // הסרנו את fetchData() כדי שהמפה לא תתרנדר מחדש ותאבד את הפוקוס!
    } catch (error) {
      console.error("Error in handleModalSubmit:", error)
      alert("שמירת המיקום נכשלה. בדוק את הקונסול.")
    }
  }

  const onDelete = async locationId => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק נקודה זו?")) {
      try {
        await deleteUsersLocationApi(locationId)
        setLocations(prev => prev.filter(loc => (loc.id || loc._id) !== locationId))
        setSelectedLoc(null)
      } catch (err) {
        console.error(err)
      }
    }
  }

  useEffect(() => {
    try {
      findUserLocations()
    } catch (error) {
      console.log(error)
    }
  }, [])

  const filteredLocationsList = useMemo(() => {
    let combined = []
    if (activeFilter === "all") {
      combined = [...locations, ...publicLocations]
    } else if (activeFilter === "mine") {
      combined = locations.filter(loc => loc.isCreatedByUser)
    } else if (activeFilter === "shared") {
      combined = publicLocations
    }
    return combined
  }, [locations, publicLocations, activeFilter])

  const renderedMarkers = useMemo(() => {
    return filteredLocationsList.map((loc, index) => {
      const lat = Number(loc.latitude)
      const lng = Number(loc.longitude)
      if (isNaN(lat) || isNaN(lng)) return null

      const markerIcon = loc.isCreatedByUser ? "📍" : "💧"

      return (
        <Marker
          key={loc.id || loc._id || index}
          latitude={lat}
          longitude={lng}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation()
            setSelectedLoc(loc)
            setShowAddPrompt(false)
          }}
        >
          <div style={{ fontSize: "28px", cursor: "pointer", willChange: "transform" }}>
            {markerIcon}
          </div>
        </Marker>
      )
    })
  }, [filteredLocationsList])

  if (loading) return <Loading />

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10, display: "flex", gap: "8px", direction: "rtl" }}>
        <button 
          onClick={() => setActiveFilter("all")} 
          style={{ padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", backgroundColor: activeFilter === "all" ? "#007bff" : "rgba(255,255,255,0.9)", color: activeFilter === "all" ? "#fff" : "#333", fontWeight: "bold", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
        >
          הכל
        </button>
        <button 
          onClick={() => setActiveFilter("shared")} 
          style={{ padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", backgroundColor: activeFilter === "shared" ? "#007bff" : "rgba(255,255,255,0.9)", color: activeFilter === "shared" ? "#fff" : "#333", fontWeight: "bold", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
        >
          משותפים / פומביות
        </button>
        <button 
          onClick={() => setActiveFilter("mine")} 
          style={{ padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", backgroundColor: activeFilter === "mine" ? "#007bff" : "rgba(255,255,255,0.9)", color: activeFilter === "mine" ? "#fff" : "#333", fontWeight: "bold", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
        >
          שלי
        </button>
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onLoad={handleMapLoad}
        onMove={evt => setViewState(evt.viewState)}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onContextMenu={e => e.originalEvent.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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

        {pinnedLocation && showAddPrompt && (
          <>
            <Marker 
              latitude={pinnedLocation.latitude} 
              longitude={pinnedLocation.longitude} 
              anchor="bottom"
            >
              <div 
                style={{ fontSize: "32px", cursor: "pointer", filter: "drop-shadow(0 0 3px red)" }} 
                onClick={openAddModal}
              >
                📍
              </div>
            </Marker>

            <Popup
              latitude={pinnedLocation.latitude}
              longitude={pinnedLocation.longitude}
              anchor="top"
              onClose={() => {
                setShowAddPrompt(false)
                setPinnedLocation(null)
              }}
              closeOnClick={false}
            >
              <div style={{ direction: "rtl", textAlign: "center", padding: "5px" }}>
                <button 
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    openAddModal()
                  }} 
                  style={{ padding: "5px 10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  הוסף מיקום כאן
                </button>
              </div>
            </Popup>
          </>
        )}

        {renderedMarkers}

        {selectedLoc && (
          <Popup
            latitude={Number(selectedLoc.latitude)}
            longitude={Number(selectedLoc.longitude)}
            anchor="top"
            onClose={() => setSelectedLoc(null)}
            closeOnClick={false}
          >
            <div style={{ direction: "rtl", padding: "5px", minWidth: "150px" }}>
              <span style={{ fontSize: "11px", color: "#666", fontWeight: "bold", display: "block", marginBottom: "2px" }}>
                {selectedLoc.isCreatedByUser ? "📌 הנקודה שלי (Saved Pins)" : "🌐 מיקום ציבורי (Locations)"}
              </span>

              <h3 style={{ margin: "0 0 5px 0" }}>{selectedLoc.name || selectedLoc.title || "נקודה ללא שם"}</h3>
              {selectedLoc.description && <p style={{ margin: "0 0 10px 0", fontSize: "14px" }}>{selectedLoc.description}</p>}
              {selectedLoc.image_url && <img src={selectedLoc.image_url} alt={selectedLoc.name} style={{ width: "100%", maxHeight: "100px", objectFit: "cover", borderRadius: "4px", marginBottom: "10px" }} />}
              
              {selectedLoc.isCreatedByUser && (
                <div style={{ display: "flex", gap: "5px" }}>
                  <button type="button" onClick={() => openEditModal(selectedLoc)} style={{ flex: 1, padding: "3px 5px", backgroundColor: "#ffc107", border: "none", borderRadius: "4px", cursor: "pointer" }}>ערוך</button>
                  <button type="button" onClick={() => onDelete(selectedLoc.id || selectedLoc._id)} style={{ flex: 1, padding: "3px 5px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>מחק</button>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {showModal && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", zIndex: 1000, minWidth: "280px", direction: "rtl" }}>
          <h3 style={{ marginTop: 0 }}>{isEditing ? "עריכת מיקום" : "הוספת מיקום חדש"}</h3>
          <div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "3px" }}>שם המקום:</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }} />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "3px" }}>תיאור:</label>
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px", minHeight: "60px" }} />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "3px" }}>תמונה:</label>
              <input type="file" accept="image/*" onChange={e => setFormImage(e.target.files[0])} style={{ width: "100%" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: "4px", background: "none", cursor: "pointer" }}>
                ביטול
              </button>
              <button type="button" onClick={handleModalSubmit} style={{ padding: "6px 12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersMap