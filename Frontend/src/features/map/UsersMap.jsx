import React, { useEffect, useState, useRef, useMemo } from "react"
import Map, { Marker, Popup, Source, Layer, NavigationControl, GeolocateControl } from "react-map-gl/mapbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

// יבוא פונקציות ה-API
import { getUsersLocationsApi, addUsersLocationApi, updateUsersLocationApi, deleteUsersLocationApi } from "../../api/general"

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
    userPosition,
    skyLayer,
    pinnedLocation,
    setPinnedLocation,
  } = useMap()

  const mapRef = useRef(null)
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [showAddPrompt, setShowAddPrompt] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // מצבי עריכה
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formImage, setFormImage] = useState(null)

  // שליפת המיקומים הפרטיים של המשתמש בלבד בטעינה הראשונית
  const fetchData = async () => {
    try {
      setLoading(true)
      const userRes = await getUsersLocationsApi()
      const userData = userRes?.data?.data || userRes?.data || userRes || []
      setLocations(userData.map(loc => ({ ...loc, isCreatedByUser: true })))
    } catch (error) {
      console.error("שגיאה בטעינת מיקומי המשתמש:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // לחיצה ארוכה בנייד או קליק ימני במחשב
  const handleMapLongPress = event => {
    if (event.originalEvent) event.originalEvent.preventDefault()
    const { lng, lat } = event.lngLat
    if (lng && lat) {
      setPinnedLocation({ latitude: lat, longitude: lng })
      setShowAddPrompt(true)
    }
  }

  // פתיחת מודל להוספת נקודה חדשה
  const openAddModal = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormName("")
    setFormDesc("")
    setFormImage(null)
    setShowModal(true)
  }

  // פתיחת מודל לעריכת נקודה קיימת לפי ID
  const openEditModal = loc => {
    setIsEditing(true)
    setEditingId(loc.id || loc._id)
    setFormName(loc.name || "")
    setFormDesc(loc.description || "")
    setFormImage(null)
    setShowModal(true)
    setSelectedLoc(loc)
  }

  // שמירת נקודה (הוספה חדשה או עדכון לפי ID)
  const handleModalSubmit = async e => {
    e.preventDefault()
    if (!formName.trim()) return

    try {
      if (isEditing) {
        // ✏️ בוקר/עדכון - תמיד בפורמט FormData להתאמה ל-FastAPI Form(...)
        const formData = new FormData()
        formData.append("name", formName.trim())
        formData.append("description", formDesc.trim())
        if (formImage) {
          formData.append("image", formImage)
        }

        const response = await updateUsersLocationApi(editingId, formData)

        // שליפת הנתונים שהוחזרו מהשרת (במידה ועודכנה תמונה חדשה)
        const updatedData = response?.data?.data?.[0] || response?.data?.[0]

        // עדכון מיידי של המצב במסך (State) ללא טעינה מחדש של השרת
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
        // ➕ הוספת נקודה חדשה
        if (!pinnedLocation) return
        const formData = new FormData()
        formData.append("name", formName.trim())
        formData.append("description", formDesc.trim())
        formData.append("latitude", String(pinnedLocation.latitude))
        formData.append("longitude", String(pinnedLocation.longitude))
        if (formImage) formData.append("image", formImage)

        const response = await addUsersLocationApi(formData)
        const newLoc = response?.data?.data?.[0] || response?.data?.[0]

        if (newLoc) {
          setLocations(prev => [...prev, { ...newLoc, isCreatedByUser: true }])
        }
      }

      // איפוס וסגירת מודלים בלבד (ללא קריאה מחדש ל-fetchData!)
      setShowModal(false)
      setShowAddPrompt(false)
      setPinnedLocation(null)
      setSelectedLoc(null)
      setFormName("")
      setFormDesc("")
      setFormImage(null)
    } catch (error) {
      console.error("שגיאה בשמירת/עדכון הנקודה:", error)
    }
  }

  // מחיקת נקודה לפי ID
  const onDelete = async locationId => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק נקודה זו?")) {
      try {
        await deleteUsersLocationApi(locationId)
        setLocations(prev => prev.filter(loc => (loc.id || loc._id) !== locationId))
        setSelectedLoc(null)
      } catch (err) {
        console.error("שגיאה במחיקה:", err)
      }
    }
  }

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
      console.log(error)
    }
  }, [])

  // 📍 ייעול ואופטימיזציה: רינדור המרקרים נשמר בזיכרון (useMemo)
  // ומתעדכן רק בעת שינוי ממשי במערך ה-locations
  const renderedMarkers = useMemo(() => {
    return locations.map((loc, index) => {
      if (!loc.latitude || !loc.longitude) return null
      return (
        <Marker
          key={loc.id || loc._id || index}
          latitude={Number(loc.latitude)}
          longitude={Number(loc.longitude)}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation()
            setSelectedLoc(loc)
          }}
        >
          <div style={{ fontSize: "28px", cursor: "pointer" }}>📍</div>
        </Marker>
      )
    })
  }, [locations])

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
        onContextMenu={handleMapLongPress}
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

        {/* סמן של לחיצה על המפה ליצירת נקודה */}
        {pinnedLocation && (
          <Marker latitude={pinnedLocation.latitude} longitude={pinnedLocation.longitude}>
            <div style={{ color: "red", fontSize: "32px", cursor: "pointer" }} onClick={() => setShowAddPrompt(true)}>
              📍
            </div>
          </Marker>
        )}

        {pinnedLocation && showAddPrompt && (
          <Popup
            latitude={pinnedLocation.latitude}
            longitude={pinnedLocation.longitude}
            anchor="top"
            onClose={() => setShowAddPrompt(false)}
            closeOnClick={false}
          >
            <div style={{ direction: "rtl", textAlign: "center", padding: "5px", fontFamily: "sans-serif" }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "bold" }}>נבחר מיקום חדש</p>
              <button
                onClick={openAddModal}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#34a853",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                ➕ הוסף נקודה
              </button>
            </div>
          </Popup>
        )}

        <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} />
        {skyLayer && <Layer {...skyLayer} />}

        {/* מיקום המשתמש הנוכחי */}
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

        {/* הצגת כל ה-Markers הממוטבים מה-useMemo */}
        {renderedMarkers}

        {/* חלונית פרטים צפה של נקודה שנבחרה */}
        {selectedLoc && (
          <Popup
            latitude={Number(selectedLoc.latitude)}
            longitude={Number(selectedLoc.longitude)}
            anchor="top"
            onClose={() => setSelectedLoc(null)}
          >
            <div style={{ direction: "rtl", textAlign: "right", fontFamily: "sans-serif", padding: "5px", width: "210px" }}>
              {(selectedLoc.image_url || selectedLoc.imageUrl || selectedLoc.image) && (
                <img
                  src={selectedLoc.image_url || selectedLoc.imageUrl || selectedLoc.image}
                  alt={selectedLoc.name}
                  style={{ width: "100%", height: "110px", objectFit: "cover", borderRadius: "4px", marginBottom: "8px" }}
                />
              )}
              <h3 style={{ margin: "0 0 5px 0", color: "#1a73e8", fontSize: "15px" }}>📍 {selectedLoc.name}</h3>
              <p style={{ margin: "5px 0", fontSize: "12px", color: "#555" }}>{selectedLoc.description || "אין תיאור"}</p>

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  marginTop: "10px",
                  borderTop: "1px solid #eee",
                  paddingTop: "6px",
                  alignItems: "center",
                }}
              >
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedLoc.latitude},${selectedLoc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1a73e8", textDecoration: "none", fontSize: "12px", fontWeight: "bold" }}
                >
                  ניווט ➔
                </a>
                <button
                  onClick={() => openEditModal(selectedLoc)}
                  style={{
                    padding: "2px 6px",
                    backgroundColor: "#fbbc05",
                    color: "black",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "11px",
                    marginRight: "auto",
                  }}
                >
                  ✏️ ערוך
                </button>
                <button
                  onClick={() => onDelete(selectedLoc.id || selectedLoc._id)}
                  style={{
                    padding: "2px 6px",
                    backgroundColor: "#d93025",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  🗑️ מחק
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* מודל להוספה / עריכה */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            direction: "rtl",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "350px",
              width: "100%",
              fontFamily: "sans-serif",
              textAlign: "right",
              margin: "auto",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "bold" }}>
              {isEditing ? "✏️ עריכת מיקום" : "📍 הוספת מיקום חדש"}
            </h3>
            <form onSubmit={handleModalSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>שם המקום:</label>
                <input
                  type="text"
                  required
                  style={{
                    width: "100%",
                    padding: "6px",
                    boxSizing: "border-box",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>תיאור:</label>
                <textarea
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "6px",
                    boxSizing: "border-box",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>
                  תמונה של המקום:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setFormImage(e.target.files[0])}
                  style={{ fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {isEditing ? "עדכן" : "שמור"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setPinnedLocation(null)
                    setShowAddPrompt(false)
                  }}
                  style={{
                    padding: "8px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersMap
