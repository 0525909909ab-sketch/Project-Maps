import api from "./client"

export const getGeneralData = async () => {
  try {
    console.log("--- DEBUG --- שולח בקשה לשרת לכתובת /places")
    const response = await api.get("/places")
    console.log("--- DEBUG --- תגובת השרת הגולמית:", response)
    return response
  } catch (error) {
    console.error("--- DEBUG ERROR --- הבקשה לשרת נכשלה לחלוטין:", error)
    // מחזירים מבנה מוגן כדי שהמפה לא תישאר תקועה במסך לבן
    return { data: { data: [] } }
  }
}

export const getUsersLocationsApi = () => {
  return api.get("/userslocations/getAll")
}

export const addUsersLocationApi = locationData => {
  // locationData יכול להיות FormData (אם יש תמונה) או אובייקט רגיל
  return api.post("/userslocations/add", locationData)
}

// 🟢 חדש: עדכון/עריכת מיקום קיים לפי ID
export const updateUsersLocationApi = (id, locationData) => {
  return api.put(`/userslocations/update/${id}`, locationData, {
    headers: {
      "Content-Type": "multipart/form-data", // 👈 Обязательно добавляем для поддержки картинок!
    },
  })
}

// 🟢 חדש: מחיקת מיקום לפי ID
export const deleteUsersLocationApi = id => {
  return api.delete(`/userslocations/delete/${id}`)
}
