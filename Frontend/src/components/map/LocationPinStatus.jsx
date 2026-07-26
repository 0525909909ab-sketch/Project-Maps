import React from "react"

const LocationPinStatus = ({ pinnedLocation }) => {
  return (
    <div style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "6px", textAlign: "center" }}>
      {pinnedLocation ? (
        <p style={{ color: "green", margin: 0, fontWeight: "bold" }}>
          ✔️ המיקום נקלט: {Number(pinnedLocation.latitude).toFixed(4)}, {Number(pinnedLocation.longitude).toFixed(4)}
        </p>
      ) : (
        <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>
          טרם נבחר מיקום. השתמש בכפתור למעלה או לחץ לחיצה כפולה על המפה למטה.
        </p>
      )}
    </div>
  )
}

export default LocationPinStatus
