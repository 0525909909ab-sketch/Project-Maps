import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import api from "../api/client"
import { logoutUser } from "../store/slices/userSlice"
import RegisterForm from "../components/auth/RegisterForm"

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(state => state.user.email)

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {})
      dispatch(logoutUser())
    } catch (error) {
      console.error("An error occurred during logging out.", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {user ? (
          /* ----- authorized user ----- */
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              {user.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome back!</h2>
              <p className="text-gray-500 mt-2">
                You are logged in as <span className="font-semibold text-gray-700">{user}</span>
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => navigate("/map")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-md hover:shadow-lg"
              >
                Go to Map 🌍
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-4 rounded-xl transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          /* ----- Guest - registration form ----- */
          <RegisterForm />
        )}
      </div>
    </div>
  )
}

export default Home
