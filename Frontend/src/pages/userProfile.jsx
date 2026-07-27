import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { getUsersSaveLocationsApi } from "../api/favorites"
import { deleteUsersLocationApi, getUsersLocationsApi, updateUsersLocationApi } from "../api/general"
import CreatedLocationsSection from "../components/ui/CreatedLocationsSection"
import SavedLocationsSection from "../components/ui/SavedLocationsSection"

const UserProfile = () => {
  const currentUser = useSelector(state => state.user?.userInfo || state.user?.user || state.user)
  
  // חילוץ ה-ID האמיתי של המשתמש (או fallback ל-id במידה וקיים, אחרת מזהה אחר)
  const userId = currentUser?.id || currentUser?._id || currentUser?.uid || currentUser?.user_id

  const [savedList, setSavedList] = useState([])
  const [createdList, setCreatedList] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState({})
  const [isCreatedOpen, setIsCreatedOpen] = useState(false)
  const [isSavedOpen, setIsSavedOpen] = useState(false)
  const [targetIdentifier, setTargetIdentifier] = useState("")
  const [grantedPermissions, setGrantedPermissions] = useState([])

  useEffect(() => {
    if (userId) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    const refreshSavedLocations = () => {
      if (userId) {
        fetchData()
      }
    }

    const handleFavoriteUpdated = event => {
      if (event?.detail?.savedItem) {
        setSavedList(prev => {
          const nextItem = normalizeLocationItem(event.detail.savedItem)
          const alreadyExists = prev.some(item => (item.id ?? item.location_id) === (nextItem.id ?? nextItem.location_id))
          return alreadyExists ? prev : [nextItem, ...prev]
        })
      }
      refreshSavedLocations()
    }

    window.addEventListener("favorites-updated", handleFavoriteUpdated)
    window.addEventListener("storage", event => {
      if (event.key === "favorites:updated") {
        refreshSavedLocations()
      }
    })

    return () => {
      window.removeEventListener("favorites-updated", handleFavoriteUpdated)
      window.removeEventListener("storage", refreshSavedLocations)
    }
  }, [userId])

  const normalizeLocationItem = item => {
    const place = item?.usersLocations || item?.locations || item?.location || item || {}
    const id = item?.id ?? place?.id ?? item?.location_id ?? place?.location_id ?? null
    const title = place?.name || item?.name || place?.address || item?.address || "נקודה ללא שם"
    const address = place?.address || item?.address || null
    const description = place?.description || item?.description || null
    const latitude = place?.latitude ?? item?.latitude ?? null
    const longitude = place?.longitude ?? item?.longitude ?? null
    const imageUrl = place?.image_url || item?.image_url || null

    return {
      ...item,
      ...place,
      id,
      name: title,
      title,
      address,
      description,
      latitude,
      longitude,
      image_url: imageUrl,
      isSaved: Boolean(item?.usersLocations || item?.locations || item?.location || item?.latitude != null || item?.longitude != null),
    }
  }

  const fetchData = async () => {
    setLoading(true)

    try {
      const [savedRes, createdRes] = await Promise.all([
        getUsersSaveLocationsApi(userId).catch(err => {
          console.error("Error fetching saved locations:", err)
          return null
        }),
        getUsersLocationsApi(userId).catch(err => {
          console.error("Error fetching created locations:", err)
          return null
        }),
      ])

      const savedRaw = savedRes?.data?.data || savedRes?.data?.favorites || savedRes?.data || []
      const createdRaw = createdRes?.data?.data || createdRes?.data?.locations || createdRes?.data || []

      const normalizedSaved = Array.isArray(savedRaw)
        ? savedRaw.map(item => {
            const normalized = normalizeLocationItem(item)
            return {
              ...normalized,
              name: normalized.name || item?.location?.name || item?.usersLocations?.name || item?.name || "נקודה שמורה",
              description: normalized.description || item?.location?.description || item?.usersLocations?.description || item?.description || null,
              address: normalized.address || item?.location?.address || item?.usersLocations?.address || item?.address || null,
              latitude: normalized.latitude ?? item?.location?.latitude ?? item?.usersLocations?.latitude ?? item?.latitude ?? null,
              longitude: normalized.longitude ?? item?.location?.longitude ?? item?.usersLocations?.longitude ?? item?.longitude ?? null,
              image_url: normalized.image_url || item?.location?.image_url || item?.usersLocations?.image_url || item?.image_url || null,
            }
          })
        : []

      const normalizedCreated = Array.isArray(createdRaw)
        ? createdRaw.map(normalizeLocationItem)
        : []

      setSavedList(normalizedSaved)
      setCreatedList(normalizedCreated)
    } catch (err) {
      console.error("Error loading profile data:", err)
      setSavedList([])
      setCreatedList([])
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = id => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDeleteCreated = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm("האם אתה בטוח שברצונך למחוק מיקום זה?")) return
    try {
      await deleteUsersLocationApi(id)
      setCreatedList(prevList => prevList.filter(item => (item.id || item._id) !== id))
    } catch (err) {
      console.error("Error deleting location:", err)
    }
  }

  const handleEdit = async (e, item) => {
    e.stopPropagation()
    const newName = window.prompt("שם חדש למיקום", item?.name || "")
    if (newName === null) return
    const newDescription = window.prompt("תיאור חדש", item?.description || "")
    if (newDescription === null) return

    try {
      const formData = new FormData()
      formData.append("name", newName.trim())
      formData.append("description", newDescription.trim())
      await updateUsersLocationApi(item.id, formData)
      setCreatedList(prev => prev.map(loc => loc.id === item.id ? { ...loc, name: newName.trim(), description: newDescription.trim() } : loc))
      window.alert("הנקודה נערכה בהצלחה")
    } catch (err) {
      console.error(err)
      window.alert("עריכת הנקודה נכשלה")
    }
  }

  const handleGrantPermission = async e => {
    e.preventDefault()
    if (!targetIdentifier) return
    try {
      const newPermission = {
        id: Date.now(),
        shared_with_name: targetIdentifier,
        shared_with_id: targetIdentifier,
      }
      setGrantedPermissions(prev => [newPermission, ...prev])
      setTargetIdentifier("")
      window.alert("נוסף לרשימת ההרשאות")
    } catch (err) {
      console.error(err)
    }
  }

  const handleRevokePermission = async id => {
    try {
      setGrantedPermissions(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>טוען נתונים...</div>

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px", direction: "rtl" }}>
      <h2 style={{ textAlign: "center", marginBottom: "25px" }}>הפרופיל שלי</h2>

      <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "15px", marginBottom: "20px", backgroundColor: "#f9f9f9" }}>
        <h3 style={{ marginTop: 0, marginBottom: "15px" }}>ניהול הרשאות שיתוף</h3>
        <form onSubmit={handleGrantPermission} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="אימייל או מזהה משתמש (ID)"
            value={targetIdentifier}
            onChange={e => setTargetIdentifier(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", flex: 1 }}
          />
          <button type="submit" style={{ padding: "8px 15px", borderRadius: "4px", backgroundColor: "#007bff", color: "#fff", border: "none", cursor: "pointer" }}>
            שיתוף
          </button>
        </form>
        <div>
          <h4 style={{ margin: "10px 0 5px 0" }}>משתמשים ששותפו:</h4>
          <ul style={{ paddingRight: "20px", margin: 0 }}>
            {grantedPermissions.map(p => (
              <li key={p.id} style={{ marginBottom: "5px" }}>
                {p.shared_with_name || p.shared_with_id}
                <button onClick={() => handleRevokePermission(p.id)} style={{ marginRight: "10px", color: "red", border: "none", background: "none", cursor: "pointer" }}>
                  ביטול הרשאה
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* אזור הנקודות שנוצרו על ידך */}
      <div style={{ border: "1px solid #ccc", borderRadius: "8px", marginBottom: "15px", overflow: "hidden" }}>
        <div 
          onClick={() => setIsCreatedOpen(!isCreatedOpen)} 
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", backgroundColor: "#eee", cursor: "pointer" }}
        >
          <span style={{ fontWeight: "bold" }}>נקודות שנוצרו על ידך ({createdList.length})</span>
          <span>{isCreatedOpen ? "▲" : "▼"}</span>
        </div>
        {isCreatedOpen && (
          <div style={{ padding: "15px" }}>
            <CreatedLocationsSection
              locations={createdList}
              expandedIds={expandedIds}
              onToggle={toggleExpand}
              onEdit={handleEdit}
              onDelete={handleDeleteCreated}
            />
          </div>
        )}
      </div>

      {/* אזור המועדפים */}
      <div style={{ border: "1px solid #ccc", borderRadius: "8px", marginBottom: "15px", overflow: "hidden" }}>
        <div 
          onClick={() => setIsSavedOpen(!isSavedOpen)} 
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", backgroundColor: "#eee", cursor: "pointer" }}
        >
          <span style={{ fontWeight: "bold" }}>מועדפים ({savedList.length})</span>
          <span>{isSavedOpen ? "▲" : "▼"}</span>
        </div>
        {isSavedOpen && (
          <div style={{ padding: "15px" }}>
            <SavedLocationsSection 
              locations={savedList} 
              expandedIds={expandedIds} 
              onToggle={toggleExpand} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile