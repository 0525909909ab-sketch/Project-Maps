import { useEffect, useState } from "react"
import { getUsersSaveLocationsApi } from "../api/favorites"
import { deleteUsersLocationApi, getUsersLocationsApi } from "../api/general"
import CreatedLocationsSection from "../components/ui/CreatedLocationsSection"
import SavedLocationsSection from "../components/ui/SavedLocationsSection"

const UserProfile = () => {
  const [savedList, setSavedList] = useState([])
  const [createdList, setCreatedList] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [savedRes, createdRes] = await Promise.all([getUsersSaveLocationsApi(), getUsersLocationsApi()])

      setSavedList(Array.isArray(savedRes.data) ? savedRes.data : [])
      const createdData = createdRes?.data?.data || createdRes?.data || []
      setCreatedList(Array.isArray(createdData) ? createdData : [])
    } catch (err) {
      console.error("שגיאה בטעינת נתוני פרופיל:", err)
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
      alert("המיקום נמחק בהצלחה!")
    } catch (err) {
      console.error("שגיאה במחיקת המיקום:", err)
      alert("נכשל במחיקת המיקום. בדוק את הקונסול לשגיאות.")
    }
  }

  const handleEdit = (e, item) => {
    e.stopPropagation()
    console.log("עריכת מיקום:", item)
  }

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>טוען נתונים...</div>

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px", direction: "rtl" }}>
      <h2 style={{ textAlign: "center", marginBottom: "25px" }}>הפרופיל שלי</h2>

      <CreatedLocationsSection
        locations={createdList}
        expandedIds={expandedIds}
        onToggle={toggleExpand}
        onEdit={handleEdit}
        onDelete={handleDeleteCreated}
      />

      <SavedLocationsSection locations={savedList} expandedIds={expandedIds} onToggle={toggleExpand} />
    </div>
  )
}

export default UserProfile
