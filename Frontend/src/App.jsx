import React, { useEffect, useState } from "react"
import GlobalMap from "./features/map/GlobalMap"
import Layout from "./pages/Layout"

import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from "./pages/Home"
import AddLocationForm from "./pages/AddLocationForm"
import UsersMap from "./features/map/UsersMap"
import UserProfile from "./pages/userProfile"
import api from "./api/client" 
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
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  }
})

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await api.get("/auth/me")

        if (response.data.success) {
          const u = response.data.user
          dispatch(
            setUser({
              id: u.id || u._id,
              name: u.name,
              email: u.email,
            }),
          )
        }
      } catch (error) {
        console.log("No active session found or cookie expired.")
        dispatch(logoutUser())
      }
    }

    restoreSession()
  }, [dispatch])

  return <RouterProvider router={myRouter} />
}

export default App