import React from "react"
import LocationCard from "./LocationCard"

const CreatedLocationsSection = ({ locations, expandedIds, onToggle, onEdit, onDelete }) => {
  return (
    <section style={{ marginBottom: "35px" }}>
      <h3 style={{ borderBottom: "2px solid #007bff", paddingBottom: "8px", marginBottom: "15px" }}>
        📍 נקודות שנוצרו על ידך ({locations.length})
      </h3>

      {locations.length === 0 ? (
        <p style={{ color: "#666" }}>אין נקודות שנוצרו עדיין.</p>
      ) : (
        locations.map(item => (
          <LocationCard
            key={item.id}
            title={item.name || "מיקום ללא שם"}
            description={item.description}
            imageUrl={item.image_url}
            isExpanded={!!expandedIds[item.id]}
            onToggle={() => onToggle(item.id)}
            onEdit={e => onEdit(e, item)}
            onDelete={e => onDelete(e, item.id)}
            isCreatedByUser={true}
          />
        ))
      )}
    </section>
  )
}

export default CreatedLocationsSection
