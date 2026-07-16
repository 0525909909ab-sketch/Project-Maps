import api from "./client";

export const addUsersSaveLocationApi = (locationId) => {
  const isNumber = !isNaN(locationId) && typeof locationId !== 'string';
  const payload = isNumber 
    ? { user_location_id: Number(locationId) } 
    : { google_place_id: String(locationId) };

  return api.post('/usersInfo/addSaveLocations', payload);
};
export const getUsersSaveLocationsApi = () => {
  return api.get('/usersInfo/saveLocations');
};
