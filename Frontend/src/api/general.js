import api from "./client"

export const getGeneralData = async () => {
  try {
    const response = await api.get("/places")
    return response
  } catch (error) {
    return { data: { data: [] } }
  }
}

export const getUsersLocationsApi = (userId) => {
  return api.get(`/userslocations/getAll`, { params: { userId } })
}

export const addUsersLocationApi = (locationData) => {
  return api.post("/userslocations/add", locationData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

export const updateUsersLocationApi = (id, locationData) => {
  return api.put(`/userslocations/update/${id}`, locationData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

export const deleteUsersLocationApi = id => {
  return api.delete(`/userslocations/delete/${id}`)
}