import React from "react"

const LocationCard = ({
  title,
  description,
  imageUrl,
  address,
  coordinates,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  isCreatedByUser,
}) => {
  return (
    <div
      onClick={onToggle}
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "10px",
        padding: "15px",
        marginBottom: "12px",
        backgroundColor: isCreatedByUser ? "#ffffff" : "#f9fbf9",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}
    >
      {/* Header of the card */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#333" }}>{title}</span>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Handler buttons shown only for already created points. */}
          {isCreatedByUser && (
            <>
              {onEdit && (
                <button
                  onClick={onEdit}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#ffc107",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ✏️ עריכה
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  🗑️ מחיקה
                </button>
              )}
            </>
          )}

          <span style={{ fontSize: "0.9rem", color: "#888", marginRight: "5px" }}>{isExpanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* open up Drawer with the details. */}
      {isExpanded && (
        <div
          style={{
            marginTop: "15px",
            paddingTop: "12px",
            borderTop: "1px solid #f0f0f0",
            color: "#555",
          }}
        >
          {description && (
            <p style={{ margin: "5px 0" }}>
              <strong>תיאור:</strong> {description}
            </p>
          )}

          {address && (
            <p style={{ margin: "5px 0" }}>
              <strong>כתובת:</strong> {address}
            </p>
          )}

          {coordinates && (
            <p style={{ margin: "5px 0" }}>
              <strong>קואורדינטות:</strong> {coordinates}
            </p>
          )}

          {imageUrl && (
            <div style={{ marginTop: "10px" }}>
              <img
                src={imageUrl}
                alt={title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "200px",
                  borderRadius: "8px",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LocationCard
