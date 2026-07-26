import React from "react"
import LocationCard from "./LocationCard"

const SavedLocationsSection = ({ locations, expandedIds, onToggle }) => {
  return (
    <section>
      <h3 style={{ borderBottom: "2px solid #28a745", paddingBottom: "8px", marginBottom: "15px" }}>
        📌 מקומות שמורים במועדפים ({locations.length})
      </h3>

      {locations.length === 0 ? (
        <p style={{ color: "#666" }}>אין מועדפים שמורים.</p>
      ) : (
        locations.map(item => {
          const place = item.usersLocations || item.locations || {}
          const itemKey = `saved-${item.id}`

          return (
            <LocationCard
              key={itemKey}
              title={place.name || place.address || "נקודה שמורה"}
              address={place.address}
              coordinates={!place.address ? `${place.latitude}, ${place.longitude}` : null}
              isExpanded={!!expandedIds[itemKey]}
              onToggle={() => onToggle(itemKey)}
              isCreatedByUser={false}
            />
          )
        })
      )}
    </section>
  )
}

export default SavedLocationsSection
