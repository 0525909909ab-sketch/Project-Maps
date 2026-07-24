import api from "./client";

// ➕ הוספת מקום למועדפים
export const addUsersSaveLocationApi = (locationId) => {
  const isNumber = !isNaN(locationId) && typeof locationId !== "string";
  const payload = isNumber
    ? { user_location_id: Number(locationId) }
    : { google_place_id: String(locationId) };

  return api.post("/usersInfo/addSaveLocations", payload);
};

// 📥 שליפת מקומות שמורים (Saved / Favorites)
export const getUsersSaveLocationsApi = () => {
  return api.get("/usersInfo/saveLocations");
};

// 📥 שליפת כל הנקודות שסומנו/נוצרו
export const getAllUserCreatedLocationsApi = () => {
  return api.get("/userslocations/getAll");
};

// 🗑️ מחיקת נקודה שנוצרה על ידי המשתמש (לפי ID)
export const deleteUserLocationApi = (locationId) => {
  return api.delete(`/userslocations/delete/${locationId}`);
};

// ✏️ עדכון נקודה שנוצרה
export const updateUserLocationApi = (locationId, formData) => {
  return api.put(`/userslocations/update/${locationId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};