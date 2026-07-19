import api from "./client"

export const loginApi = (email, password) => {
  return api.post("/auth/login", { email, password })
}

export const registerApi = (name, email, password) => {
  return api.post("/auth/register", { name, email, password })
}
