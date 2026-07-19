import React from 'react';
import GlobalMap from '../../features/map/GlobalMap'; 

function UsersMap() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <GlobalMap showOnlyUserLocations={true} />
    </div>
  );
}

export default UsersMap;
