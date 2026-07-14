import { useForm } from "react-hook-form"; 
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerApi } from "../api/auth";
const Home = () => {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const authPayload = {
      email: data.email,
      password: data.password
    };

    const reduxPayload = {
      name: data.name,
      email: data.email,
      password: data.password
    };

    try {
      const response = await registerApi(data.email, data.password); 
      navigate('/map');     
    } catch (error) {
      console.log("error");
    }
  };

  return (
    <div className="Home-Page"> 
      <h2>Welcome to our home page </h2>
      

      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="name">Enter your name</label>
        <input 
          id="name"
          {...register("name", { required: true, maxLength: 20 })} 
          type="text"
        />
        {errors.name && <p className="error-msg">Name is required</p>}
        <br />

        <label htmlFor="email">enter your email</label>
        <input 
          id="email"
          type="email" 
          {...register("email", { required: true })} 
        />
        {errors.email && <p className="error-msg">The email is required</p>}
        <br />

        <label htmlFor="password">enter your password</label>
        <input 
          id="password"
          type="password"
          {...register("password", { required: true, minLength: 5 })} 
        />
        {errors.password && <p className="error-msg">password need to be at least 5 chars</p>}
        <br />
        
        <input type="submit" value="Register" />
      </form>
      
      {/* כפתור למעבר מהיר לעמוד ההתחברות */}
      <div style={{ marginTop: '20px' }}>
        <span>Already have an account? </span>
        <button 
          onClick={() => navigate('/login')}
          style={{
            cursor: 'pointer',
            padding: '5px 10px',
            backgroundColor: '#1a73e8',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default Home;
