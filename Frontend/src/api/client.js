import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true,
})

// שליפה ישירה של הטוקן מ-localStorage בלי תלות בחבילות חיצוניות
api.interceptors.request.use((config) => {
  try {
    const storageKeys = Object.keys(localStorage)
    const supabaseKey = storageKeys.find(key => key.startsWith("sb-") && key.endsWith("-auth-token"))
    
    if (supabaseKey) {
      const sessionData = JSON.parse(localStorage.getItem(supabaseKey))
      const token = sessionData?.access_token

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch (error) {
    console.error("Error attaching token from localStorage:", error)
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export default api