import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { getUsersSaveLocationsApi } from "../api/favorites"
import { deleteUsersLocationApi, getUsersLocationsApi } from "../api/general"
import CreatedLocationsSection from "../components/ui/CreatedLocationsSection"
import SavedLocationsSection from "../components/ui/SavedLocationsSection"

const UserProfile = () => {
  const currentUser = useSelector(state => state.user?.userInfo || state.user?.user || state.user)
  const userId = currentUser?.id || currentUser?.uid || currentUser?._id

  const [savedList, setSavedList] = useState([])
  const [createdList, setCreatedList] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState({})
  const [isCreatedOpen, setIsCreatedOpen] = useState(false)
  const [isSavedOpen, setIsSavedOpen] = useState(false)
  const [targetIdentifier, setTargetIdentifier] = useState("")
  const [grantedPermissions, setGrantedPermissions] = useState([])

  useEffect(() => {
    // ממתין שיהיה userId אמיתי לפני ששולחים בקשות לשרת
    if (userId) {
      fetchData()
    } else {
      // אם אין עדיין משתמש, מפסיקים את ה-loading כדי לא להקפיא את המסך
      setLoading(false)
    }
  }, [userId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [savedRes, createdRes] = await Promise.all([
        getUsersSaveLocationsApi(), 
        getUsersLocationsApi(userId)
      ])
      setSavedList(Array.isArray(savedRes.data) ? savedRes.data : [])
      const createdData = createdRes?.data?.data || createdRes?.data || []
      setCreatedList(Array.isArray(createdData) ? createdData : [])
    } catch (err) {
      console.error(err)
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
      setCreatedList(prevList => prevList.filter(item => item.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (e, item) => {
    e.stopPropagation()
  }

  const handleGrantPermission = async e => {
    e.preventDefault()
    if (!targetIdentifier) return
    try {
      setTargetIdentifier("")
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

      <div style={{ border: "1px solid #ccc", borderRadius: "8px", marginBottom: "15px", overflow: "hidden" }}>
        <div 
          onClick={() => setIsCreatedOpen(!isCreatedOpen)} 
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", backgroundColor: "#eee", cursor: "pointer" }}
        >
          <span style={{ fontWeight: "bold" }}>נקודות שנוצרו על ידך</span>
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

      <div style={{ border: "1px solid #ccc", borderRadius: "8px", marginBottom: "15px", overflow: "hidden" }}>
        <div 
          onClick={() => setIsSavedOpen(!isSavedOpen)} 
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", backgroundColor: "#eee", cursor: "pointer" }}
        >
          <span style={{ fontWeight: "bold" }}>מועדפים</span>
          <span>{isSavedOpen ? "▲" : "▼"}</span>
        </div>
        {isSavedOpen && (
          <div style={{ padding: "15px" }}>
            <SavedLocationsSection locations={savedList} expandedIds={expandedIds} onToggle={toggleExpand} />
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile