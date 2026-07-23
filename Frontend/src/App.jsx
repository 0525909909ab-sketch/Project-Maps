import React, { useEffect, useState } from "react"
import GlobalMap from "./features/map/GlobalMap"
import mapboxgl from "mapbox-gl"
import Layout from "./pages/Layout"
import Login from "./pages/Login"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from "./pages/Home"
import AddLocationForm from "./pages/AddLocationForm"
import UsersMap from "./features/map/UsersMap"
import UserProfile from "./pages/userProfile"
import axios from "axios"
import { useDispatch } from "react-redux"
import { setUser, logoutUser } from "./store/slices/userSlice"

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

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // 🌟 withCredentials: true necessary, Otherwise browser will not add HttpOnly Cookie.!
        const response = await axios.get("http://localhost:8000/auth/me", {
          withCredentials: true,
        })

        // In case. 200 OK and return user
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
