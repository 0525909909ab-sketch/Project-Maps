import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { addUsersLocationApi } from "../api/general"
import GlobalMap from "../features/map/GlobalMap"
import { useMap } from "../context/mapContext"
import LocationPinStatus from "../components/map/LocationPinStatus"
import LocationFormFields from "../components/map/LocationFormFields"

const AddLocationForm = () => {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState("")
  const [geoError, setGeoError] = useState("")
  const [isSubmittingState, setIsSubmittingState] = useState(false)

  const { findUserLocations, userPosition, pinnedLocation, setPinnedLocation, setLocations } = useMap()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm()

  useEffect(() => {
    if (userPosition && userPosition.latitude && userPosition.longitude) {
      setPinnedLocation({
        latitude: userPosition.latitude,
        longitude: userPosition.longitude,
      })
      setGeoError("")
    }
  }, [userPosition, setPinnedLocation])

  const handleGetCurrentLocation = async () => {
    setGeoError("")
    try {
      await findUserLocations()
    } catch (error) {
      console.error("GPS Error:", error)
      setGeoError("לא ניתן היה לקבוע את המיקום הנוכחי שלך. חפש במפה.")
    }
  }

  const onSubmit = async data => {
    if (!pinnedLocation) {
      setApiError("חובה לבחור מיקום על גבי המפה או באמצעות ה-GPS לפני השמירה!")
      return
    }

    try {
      setApiError("")
      setIsSubmittingState(true)

      const formData = new FormData()
      formData.append("name", data.name.trim())
      formData.append("description", (data.description || "").trim())
      formData.append("latitude", String(pinnedLocation.latitude))
      formData.append("longitude", String(pinnedLocation.longitude))

      if (data.image && data.image.length > 0) {
        formData.append("image", data.image[0])
      }

      const response = await addUsersLocationApi(formData)
      const newSavedLocation = response?.data?.data || response?.data || response

      if (newSavedLocation && setLocations) {
        setLocations(prev =>
          Array.isArray(prev) ? [...prev, { ...newSavedLocation, isCreatedByUser: true }] : [newSavedLocation],
        )
      }

      setPinnedLocation(null)
      reset()
      navigate("/map")
    } catch (error) {
      console.error("Error adding location:", error)
      const serverMessage =
        error?.response?.data?.message || error?.response?.data?.error || "הוספת המיקום נכשלה. בדוק את חיבור השרת."
      setApiError(serverMessage)
    } finally {
      setIsSubmittingState(false)
    }
  }

  return (
    <div
      className="Add-Location-Page"
      style={{
        padding: "20px",
        maxWidth: "450px",
        margin: "0 auto",
        fontFamily: "sans-serif",
        direction: "rtl",
        textAlign: "right",
      }}
    >
      <h2>הוספת מיקום חדש למפה 📍</h2>

      {apiError && (
        <p style={{ color: "red", fontWeight: "bold", backgroundColor: "#ffebee", padding: "10px", borderRadius: "4px" }}>
          {apiError}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 🚀 Вставляем вынесенные поля формы */}
        <LocationFormFields
          register={register}
          errors={errors}
          geoError={geoError}
          onGetCurrentLocation={handleGetCurrentLocation}
        />

        {/* chosen pin status */}
        <LocationPinStatus pinnedLocation={pinnedLocation} />

        {/* Handler buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
          <button
            type="submit"
            disabled={isSubmittingState}
            style={{
              padding: "12px 20px",
              backgroundColor: "#1a73e8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              flex: 1,
              fontWeight: "bold",
            }}
          >
            {isSubmittingState ? "שומר..." : "שמור מיקום"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPinnedLocation(null)
              navigate("/map")
            }}
            style={{
              padding: "12px 20px",
              backgroundColor: "#ccc",
              color: "#333",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ביטול
          </button>
        </div>
      </form>

      {/* map to check the point on */}
      <div
        className="global-map"
        style={{
          marginTop: "20px",
          height: "350px",
          width: "100%",
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <GlobalMap showOnlyUserLocations={true} />
      </div>
    </div>
  )
}

export default AddLocationForm
