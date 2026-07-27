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
          const place = item?.usersLocations || item?.locations || item?.location || item || {}
          const itemKey = `saved-${item?.id || place?.id || Math.random()}`
          const title = item?.name || place?.name || item?.address || place?.address || "נקודה שמורה"
          const address = item?.address || place?.address || null
          const coordinates = item?.latitude != null && item?.longitude != null
            ? `${item.latitude}, ${item.longitude}`
            : place?.latitude != null && place?.longitude != null
              ? `${place.latitude}, ${place.longitude}`
              : null

          return (
            <LocationCard
              key={itemKey}
              title={title}
              address={address}
              coordinates={coordinates}
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
