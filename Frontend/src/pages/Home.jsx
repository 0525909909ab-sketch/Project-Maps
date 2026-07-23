import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { registerApi } from "../api/auth"
import axios from "axios"
import { logoutUser, setUser } from "../store/slices/userSlice"

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Get user data from Redux.
  // (Check the correct path to state.user, depends on your store configuration)
  const user = useSelector(state => state.user.email)

  // State for displaying API errors on the screen
  const [apiError, setApiError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async data => {
    try {
      setApiError("") // Clean up.

      // 1. Send data to the server
      const response = await registerApi(data.name, data.email, data.password)

      // 2. Save to global state
      dispatch(
        setUser({
          name: data.name,
          email: data.email,
        }),
      )

      // 3. Перенаправляем на карту
      navigate("/map")
    } catch (error) {
      console.error("Registration failed:", error)
      // Показываем ошибку пользователю
      setApiError("שגיאה בהרשמה: המייל כבר קיים או שגיאת רשת") // Или на английском/русском
    }
  }

  const handleLogout = async () => {
    try {
      // 1. ask backend to kill HttpOnly cookie (logout)
      await axios.post(
        "http://localhost:8000/auth/logout",
        {},
        {
          withCredentials: true,
        },
      )

      // 2. clean global state Redux
      dispatch(logoutUser())
    } catch (error) {
      console.error("An error occurred during logging out.", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {user ? (
          /* ----- authorized user interface ----- */
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
          /* ----- Guest interface (registration form) ----- */
          <>
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
              <p className="text-sm text-gray-500 mt-2">Join us to explore the global map</p>
            </div>

            {apiError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">{apiError}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-colors ${
                    errors.name
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                  {...register("name", { required: true, maxLength: 20 })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">Name is required</p>}
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-colors ${
                    errors.email
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                  {...register("email", { required: true })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">A valid email is required</p>}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-colors ${
                    errors.password
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                  {...register("password", { required: true, minLength: 5 })}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">Password must be at least 5 characters</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-md hover:shadow-lg mt-2"
              >
                Register
              </button>
            </form>

            {/* Login Link */}
            <div className="pt-4 text-center border-t border-gray-100">
              <span className="text-gray-600 text-sm">Already have an account? </span>
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
              >
                Log in here
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Home
