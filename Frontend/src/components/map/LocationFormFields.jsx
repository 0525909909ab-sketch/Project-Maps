import React from "react"

const LocationFormFields = ({ register, errors, geoError, onGetCurrentLocation }) => {
  return (
    <>
      {/* שם המקום */}
      <div style={{ marginBottom: "15px" }}>
        <label htmlFor="name" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
          שם המקום:
        </label>
        <input
          id="name"
          type="text"
          style={{ width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }}
          {...register("name", { required: "שם המקום הוא שדה חובה", maxLength: 50 })}
        />
        {errors.name && <p style={{ color: "red", margin: "5px 0 0 0", fontSize: "13px" }}>{errors.name.message}</p>}
      </div>

      {/* תיאור המקום */}
      <div style={{ marginBottom: "15px" }}>
        <label htmlFor="description" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
          תיאור / הערות:
        </label>
        <textarea
          id="description"
          rows="3"
          style={{
            width: "100%",
            padding: "10px",
            boxSizing: "border-box",
            borderRadius: "4px",
            border: "1px solid #ccc",
            resize: "vertical",
          }}
          {...register("description")}
        />
      </div>

      {/* הוספת תמונה */}
      <div style={{ marginBottom: "15px" }}>
        <label htmlFor="image" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
          הוסף תמונה (אופציונלי):
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          {...register("image")}
        />
      </div>

      {/* כפתור מיקום GPS */}
      <div style={{ marginBottom: "20px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
        <button
          type="button"
          onClick={onGetCurrentLocation}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#34a853",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          📍 השתמש במיקום הנוכחי שלי
        </button>
        {geoError && <p style={{ color: "orange", margin: "5px 0 0 0", fontSize: "13px", fontWeight: "bold" }}>{geoError}</p>}
      </div>
    </>
  )
}

export default LocationFormFields
