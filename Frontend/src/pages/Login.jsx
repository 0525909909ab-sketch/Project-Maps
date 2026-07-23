import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { loginApi } from "../api/auth"
import { setUser } from "../store/slices/userSlice"

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [apiError, setApiError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async data => {
    try {
      setApiError("")

      const response = await loginApi(data.email, data.password)

      // save user in Redux state.
      if (response.data.success && response.data.user) {
        dispatch(
          setUser({
            name: response.data.user.name || "User", // Supabase - May not have name in object by login.
            email: response.data.user.email,
          }),
        )
      }

      navigate("/map")
    } catch (error) {
      console.log("Login error:", error)
      setApiError("שגיאה בהתחברות: אימייל או סיסמה שגויים")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* Заголовок */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-2">Login to your account to continue</p>
        </div>

        {/* Show: server error block */}
        {apiError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">{apiError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-colors ${
                errors.email ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
              }`}
              {...register("email", { required: true })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">The email is required</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
            {errors.password && <p className="text-red-500 text-xs mt-1">Password needs to be at least 5 chars</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-md hover:shadow-lg mt-2"
          >
            Login
          </button>
        </form>

        {/* Link to registration */}
        <div className="pt-4 text-center border-t border-gray-100">
          <span className="text-gray-600 text-sm">Don't have an account? </span>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
