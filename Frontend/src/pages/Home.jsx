import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { registerApi } from "../api/auth"
import { setUser } from "../store/slices/userSlice"
const Home = () => {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const dispatch = useDispatch() // dispatch init

  const onSubmit = async data => {
    try {
      // 1. send all data to server (or Supabase)
      const response = await registerApi(data.name, data.email, data.password)

      // 2. Save user in the global state of application
      dispatch(
        setUser({
          // TODO: add function from Redux that will manage the data
          name: data.name,
          email: data.email,
        }),
      )

      // 3. Navigate to the map after successful registration
      navigate("/map")
    } catch (error) {
      console.error("Registration failed:", error)
      // TODO: SHOW error to the user on the screen and not just in the console!!!
    }
  }

  return (
    <div className="Home-Page">
      <h2>Welcome to our home page </h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="name">Enter your name</label>
        <input id="name" {...register("name", { required: true, maxLength: 20 })} type="text" />
        {errors.name && <p className="error-msg">Name is required</p>}
        <br />

        <label htmlFor="email">enter your email</label>
        <input id="email" type="email" {...register("email", { required: true })} />
        {errors.email && <p className="error-msg">The email is required</p>}
        <br />

        <label htmlFor="password">enter your password</label>
        <input id="password" type="password" {...register("password", { required: true, minLength: 5 })} />
        {errors.password && <p className="error-msg">password need to be at least 5 chars</p>}
        <br />

        <input type="submit" value="Register" />
      </form>

      {/* כפתור למעבר מהיר לעמוד ההתחברות */}
      <div style={{ marginTop: "20px" }}>
        <span>Already have an account? </span>
        <button
          onClick={() => navigate("/login")}
          style={{
            cursor: "pointer",
            padding: "5px 10px",
            backgroundColor: "#1a73e8",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}

export default Home
