import { NavLink } from "react-router-dom";

const NavBar = () => {
  // פונקציית עזר לעיצוב קישור פעיל (העמוד הנוכחי שהמשתמש נמצא בו)
  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    color: isActive ? '#1a73e8' : '#5f6368',
    backgroundColor: isActive ? '#e8f0fe' : 'transparent',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '15px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  });

  return (
    <nav className="nav-bar" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 24px',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      borderRadius: '12px',
      maxWidth: 'fit-content',
      margin: '15px auto',
      fontFamily: 'sans-serif',
      direction: 'rtl' // מותאם לעברית מימין לשמאל
    }}>
      {/* דף הבית */}
      <NavLink to="/" style={navLinkStyle}>
        <span>🏠</span> דף הבית
      </NavLink>

      {/* מפת העולם הכללית */}
      <NavLink to="/map" style={navLinkStyle}>
        <span>🌐</span> מפת העולם
      </NavLink>

      {/* מפת המשתמשים שעדכנו עכשיו */}
      <NavLink to="/usersMap" style={navLinkStyle}>
        <span>🗺️</span> מפת משתמשים
      </NavLink>
      <NavLink to="/userProfile" style={navLinkStyle}>
        <span>🗺️</span> profile page
      </NavLink>

      {/* הוספת מקום חדש */}
      <NavLink to="/addLocationForm" style={{
        ...navLinkStyle({ isActive: false }), // בסיס העיצוב
        backgroundColor: '#1a73e8', // צבע בולט יותר כפתור פעולה
        color: '#ffffff',
      }}
      // אפקט צבע ספציפי לכפתור ההוספה כשנמצאים בעמוד שלו
      className={({ isActive }) => isActive ? "active-action-btn" : ""}
      >
        <span>➕</span> הוספת מקום
      </NavLink>
    </nav>
  );
};

export default NavBar;
