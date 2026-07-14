import { NavLink } from "react-router-dom";

const NavBar=()=>{




return(
<div className="nav-bar">
      
      <NavLink to="/addLocationForm" >
        add place
      </NavLink>
      <NavLink to="/" >
        Home
      </NavLink>
     </div>

)


}
export default NavBar