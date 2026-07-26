import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { registerApi } from "../../api/auth"
import { setUser } from "../../store/slices/userSlice"
import InputField from "../ui/InputField"

const RegisterForm = () => {
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
      const response = await registerApi(data.name, data.email, data.password)
      dispatch(setUser({ name: data.name, email: data.email }))
      navigate("/map")
    } catch (error) {
      console.error("Registration failed:", error)
      setApiError("שגיאה בהרשמה: המייל כבר קיים או שגיאת רשת")
    }
  }

  return (
    <>
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
        <p className="text-sm text-gray-500 mt-2">Join us to explore the global map</p>
      </div>

      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">{apiError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
        <InputField
          id="name"
          label="Name"
          placeholder="John Doe"
          register={register}
          validation={{ required: true, maxLength: 20 }}
          error={errors.name}
          errorMessage="Name is required"
        />
        <InputField
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          register={register}
          validation={{ required: true }}
          error={errors.email}
          errorMessage="A valid email is required"
        />
        <InputField
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          register={register}
          validation={{ required: true, minLength: 5 }}
          error={errors.password}
          errorMessage="Password must be at least 5 characters"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-md hover:shadow-lg mt-2"
        >
          Register
        </button>
      </form>

      <div className="pt-4 text-center border-t border-gray-100 mt-6">
        <span className="text-gray-600 text-sm">Already have an account? </span>
        <button
          onClick={() => navigate("/login")}
          className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
        >
          Log in here
        </button>
      </div>
    </>
  )
}

export default RegisterForm
