import React, { useEffect, useState } from "react"
import GlobalMap from "./features/map/GlobalMap"
import Layout from "./pages/Layout"

import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from "./pages/Home"
import AddLocationForm from "./pages/AddLocationForm"
import UsersMap from "./features/map/UsersMap"
import UserProfile from "./pages/userProfile"
import api from "./api/client" // 👈 משתמשים בלקוח ה-API המרכזי
import { useDispatch } from "react-redux"
import { setUser, logoutUser } from "./store/slices/userSlice"
import Login from "./components/auth/Login"

const myRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "map", element: <GlobalMap /> },
      { path: "usersMap", element: <UsersMap /> },
      { path: "userProfile", element: <UserProfile /> },
      { path: "addLocationForm", element: <AddLocationForm /> },
      { path: "login", element: <Login /> },
    ],
  },
])

function App() {
  const dispatch = useDispatch()

  // 🌟 Restore user session on app load and check if session exists yet
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // 🌟 api כבר כולל withCredentials: true ו-baseURL אחיד
        const response = await api.get("/auth/me")

        // In case 200 OK and return user
        if (response.data.success) {
          dispatch(
            setUser({
              name: response.data.user.name,
              email: response.data.user.email,
            }),
          )
        }
      } catch (error) {
        // If an error is received (e.g., 401 Unauthorized - no cookies)
        // Ensure Redux remains clean
        console.log("No active session found or cookie expired.")
        dispatch(logoutUser())
      }
    }

    restoreSession()
  }, [dispatch])

  return <RouterProvider router={myRouter} />
}

export default App
