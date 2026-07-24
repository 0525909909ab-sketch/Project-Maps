import { useEffect, useState } from "react";
import {
  getUsersSaveLocationsApi,
  getAllUserCreatedLocationsApi,
  deleteUserLocationApi,
} from "../api/info";

const UserProfile = () => {
  const [savedList, setSavedList] = useState([]);
  const [createdList, setCreatedList] = useState([]);
  const [loading, setLoading] = useState(true);

  // סטאט לשמירת מזהי המיקומים המורחבים (פתוחים)
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [savedRes, createdRes] = await Promise.all([
        getUsersSaveLocationsApi(),
        getAllUserCreatedLocationsApi(),
      ]);

      setSavedList(Array.isArray(savedRes.data) ? savedRes.data : []);
      setCreatedList(Array.isArray(createdRes.data) ? createdRes.data : []);
    } catch (err) {
      console.error("שגיאה בטעינת נתוני פרופיל:", err);
    } finally {
      setLoading(false);
    }
  };

  // פתיחה/סגירה של פרטי המיקום
  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 🗑️ מחיקה אמיתית מול השרת ועדכון המסך
  const handleDeleteCreated = async (e, id) => {
    e.stopPropagation(); // מונע את פתיחת/סגירת הכרטיסייה בלחיצה על המחיקה

    if (!window.confirm("האם אתה בטוח שברצונך למחוק מיקום זה?")) return;

    try {
      // 1. קריאת API למחיקה ב-Backend
      await deleteUserLocationApi(id);

      // 2. הסרת הפריט מה-State המקומי מיד
      setCreatedList((prevList) => prevList.filter((item) => item.id !== id));

      alert("המיקום נמחק בהצלחה!");
    } catch (err) {
      console.error("שגיאה במחיקת המיקום:", err);
      alert("נכשל במחיקת המיקום. בדוק את הקונסול לשגיאות.");
    }
  };

  // ✏️ פונקציית עריכה (לחיבור למודל או דף עריכה בעתיד)
  const handleEdit = (e, item) => {
    e.stopPropagation();
    console.log("עריכת מיקום:", item);
    // כאן תוכל לפתוח Modal עריכה
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>טוען נתונים...</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px", direction: "rtl" }}>
      <h2 style={{ textAlign: "center", marginBottom: "25px" }}>הפרופיל שלי</h2>

      {/* חלק 1: נקודות שסומנו / נוצרו על ידי המשתמש */}
      <section style={{ marginBottom: "35px" }}>
        <h3 style={{ borderBottom: "2px solid #007bff", paddingBottom: "8px", marginBottom: "15px" }}>
          📍 נקודות שנוצרו על ידך ({createdList.length})
        </h3>

        {createdList.length === 0 ? (
          <p style={{ color: "#666" }}>אין נקודות שנוצרו עדיין.</p>
        ) : (
          createdList.map((item) => {
            const isExpanded = !!expandedIds[item.id];

            return (
              <div
                key={item.id}
                onClick={() => toggleExpand(item.id)}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "12px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {/* שורה עליונה: שם המיקום + כפתורים */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#333" }}>
                    {item.name || "מיקום ללא שם"}
                  </span>

                  {/* כפתורי עריכה ומחיקה מופיעים לפני החץ */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      onClick={(e) => handleEdit(e, item)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#ffc107",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      ✏️ עריכה
                    </button>

                    <button
                      onClick={(e) => handleDeleteCreated(e, item.id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      🗑️ מחיקה
                    </button>

                    <span style={{ fontSize: "0.9rem", color: "#888", marginRight: "5px" }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* תיאור ותמונה שנפתחים רק בלחיצה */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: "15px",
                      paddingTop: "12px",
                      borderTop: "1px solid #f0f0f0",
                      color: "#555",
                    }}
                  >
                    <p style={{ margin: "5px 0" }}>
                      <strong>תיאור:</strong> {item.description || "אין תיאור למיקום זה."}
                    </p>

                    {item.image_url && (
                      <div style={{ marginTop: "10px" }}>
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            borderRadius: "8px",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* חלק 2: מועדפים / מקומות שמורים */}
      <section>
        <h3 style={{ borderBottom: "2px solid #28a745", paddingBottom: "8px", marginBottom: "15px" }}>
          📌 מקומות שמורים במועדפים ({savedList.length})
        </h3>

        {savedList.length === 0 ? (
          <p style={{ color: "#666" }}>אין מועדפים שמורים.</p>
        ) : (
          savedList.map((item) => {
            const place = item.usersLocations || item.locations || {};
            const itemKey = `saved-${item.id}`;
            const isExpanded = !!expandedIds[itemKey];

            return (
              <div
                key={itemKey}
                onClick={() => toggleExpand(itemKey)}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "12px",
                  backgroundColor: "#f9fbf9",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#333" }}>
                    {place.name || place.address || "נקודה שמורה"}
                  </span>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", color: "#888" }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: "15px", paddingTop: "12px", borderTop: "1px solid #eee" }}>
                    <p style={{ margin: "0" }}>
                      <strong>כתובת / קואורדינטות:</strong> {place.address || `${place.latitude}, ${place.longitude}`}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};

export default UserProfile;