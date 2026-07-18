import api from "./client";

export const getGeneralData = async () => {
  try {
    console.log("--- DEBUG --- שולח בקשה לשרת לכתובת /places");
    const response = await api.get('/places');
    console.log("--- DEBUG --- תגובת השרת הגולמית:", response);
    return response;
  } catch (error) {
    console.error("--- DEBUG ERROR --- הבקשה לשרת נכשלה לחלוטין:", error);
    // מחזירים מבנה מוגן כדי שהמפה לא תישאר תקועה במסך לבן
    return { data: { data: [] } }; 
  }
};



export const getUsersLocationsApi = () => {
  return api.get('/userslocations/getAll');
};



export const addUsersLocationApi = (locationData) => {
  // locationData יתקבל מהטופס כמבנה: { name, description, latitude, longitude }
  return api.post('/userslocations/add', locationData);
};