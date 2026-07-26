import { createContext, useEffect, useContext, useState } from "react"
import { addUsersSaveLocationApi } from "../api/favorites"

const MapContext = createContext(null)

export const MapProvider = ({ children }) => {
  const [userPosition, setUserPosition] = useState(null)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [pinnedLocation, setPinnedLocation] = useState(null)

  const findUserLocations = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords
          setUserPosition({ latitude, longitude })
        },
        error => {
          console.log(error)
        },
      )
    }
  }

  const skyLayer = {
    id: "sky",
    type: "sky",
    paint: {
      "sky-type": "atmosphere",
      "sky-atmosphere-sun": [0.0, 45.0],
      "sky-atmosphere-sun-intensity": 15,
    },
  }

  const [viewState, setViewState] = useState({
    latitude: 32.8,
    longitude: 35.5,
    zoom: 11,
    pitch: 60,
    bearing: 0,
  })

  const handleSave = async selectedLoc => {
    try {
      await addUsersSaveLocationApi(selectedLoc.id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <MapContext.Provider
      value={{
        handleSave,
        loading,
        setLoading,
        viewState,
        setViewState,
        skyLayer,
        userPosition,
        setUserPosition,
        findUserLocations,
        locations,
        setLocations,
        pinnedLocation,
        setPinnedLocation,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within MapProvider")
  }
  return context
}
