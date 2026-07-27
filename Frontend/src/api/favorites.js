import api from "./client"

export const addUsersSaveLocationApi = (locationData, userId) => {
  const payload = {}

  if (typeof locationData === "number") {
    payload.location_id = locationData
  } else if (locationData && typeof locationData === "object") {
    const isNumeric = value => value != null && String(value).trim() !== "" && !Number.isNaN(Number(value))

    if (isNumeric(locationData.location_id)) payload.location_id = Number(locationData.location_id)
    if (isNumeric(locationData.user_location_id)) payload.user_location_id = Number(locationData.user_location_id)
    if (isNumeric(locationData.id)) payload.id = Number(locationData.id)

    if (locationData.google_place_id != null) payload.google_place_id = locationData.google_place_id
    else if (locationData.place_id != null) payload.google_place_id = locationData.place_id
    else if (locationData.id != null && !isNumeric(locationData.id)) payload.google_place_id = String(locationData.id)

    if (locationData.latitude != null) payload.latitude = Number(locationData.latitude)
    if (locationData.longitude != null) payload.longitude = Number(locationData.longitude)
  }

  return api.post("/usersInfo/addSaveLocations", payload, {
    params: userId ? { userId } : undefined,
  })
}

export const getUsersSaveLocationsApi = (userId) => {
  return api.get("/usersInfo/saveLocations", { params: { userId } })
}