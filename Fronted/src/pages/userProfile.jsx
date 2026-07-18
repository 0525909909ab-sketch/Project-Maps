import { useEffect, useState } from "react";
import { getUsersSaveLocationsApi } from "../api/info";

const UserProfile = () => {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUserSaveSpot = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsersSaveLocationsApi();
        const data = response?.data || response || [];
        setUserList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch saved locations:", err);
        setError("Could not load your saved locations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    getUserSaveSpot();
  }, []);

  if (loading) {
    return (
      <div>
        <p>Loading profile and saved places...</p>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>Explorer Profile</h1>
        <p>Account Type: Premium Member</p>
      </header>

      <hr />

      <section>
        <h2>Profile Overview</h2>
        <ul>
          <li><strong>Total Saved Pins:</strong> {userList.length}</li>
          <li><strong>Account Status:</strong> Active</li>
        </ul>
      </section>

      <hr />

      <section>
        <h2>Your Saved Locations</h2>

        {error && (
          <div>
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {userList.length === 0 ? (
          <div>
            <p>No places saved yet.</p>
          </div>
        ) : (
          <ul>
            {userList.map((item) => {
              // 💡 Determine if this is a custom user location or a Google place
              const isCustomLocation = !!item.user_location_id;
              const locationDetails = isCustomLocation 
                ? item.usersLocations 
                : item.googlePlaces; // Fallback to your google table payload

              const name = locationDetails?.name || "Unknown Location";
              const lat = locationDetails?.latitude;
              const lng = locationDetails?.longitude;
              const address = locationDetails?.address || null;

              return (
                <li key={item.id}>
                  <h3>
                    {name} 
                    <small> ({isCustomLocation ? "Custom Pin" : "Google Place"})</small>
                  </h3>
                  
                  <p>Pin System ID: {item.id}</p>
                  {address && <p>Address: {address}</p>}
                  {!isCustomLocation && <p>Google Place ID: {item.google_place_id}</p>}
                  
                  {lat && lng && (
                    <p>Coordinates: {lat}, {lng}</p>
                  )}
                  
                  <p>Saved on: {new Date(item.created_at).toLocaleDateString()}</p>

                  {lat && lng && (
                    <p>
                      <a 
                        href={`https://google.com{lat},${lng}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Open in Google Maps
                      </a>
                    </p>
                  )}
                  <hr />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default UserProfile;
