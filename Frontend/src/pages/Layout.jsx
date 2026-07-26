import { Outlet } from "react-router-dom"
import NavBar from "../components/NavBar"

const Layout = () => {
  return (
    <div className="Layout-page">
      <NavBar />
      <Outlet />
    </div>
  )
}

export default Layout
