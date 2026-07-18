import { useForm } from "react-hook-form"; 
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginApi } from "../api/auth"; // ייבוא פונקציית ההתחברות מה-API שלך

const Login = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(""); // סטייט להצגת שגיאות מהשרת במקרה של פרטים שגויים
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setApiError(""); // איפוס שגיאות קודמות בכל ניסיון שליחה
      
      // שליחת המייל והסיסמה בנפרד כפי שהגדרת בקובץ ה-API שלך
      const response = await loginApi(data.email, data.password); 
      
      // אם ההתחברות הצליחה, מעבירים את המשתמש לעמוד המפה
      navigate('/map');     
    } catch (error) {
      console.log("Login error:", error);
      // הצגת שגיאה מתאימה למשתמש במידה והפרטים לא נכונים
    }
  };

  return (
    <div className="Login-Page"> 
      <h2>Login to your account</h2>
      
      {/* הצגת שגיאת השרת במידה וקיימת */}

      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="email">Enter your email</label>
        <input 
          id="email"
          type="email" 
          {...register("email", { required: true })} 
        />
        {errors.email && <p className="error-msg">The email is required</p>}
        <br />

        <label htmlFor="password">Enter your password</label>
        <input 
          id="password"
          type="password"
          {...register("password", { required: true, minLength: 5 })} 
        />
        {errors.password && <p className="error-msg">Password need to be at least 5 chars</p>}
        <br />
        
        <input type="submit" value="Login" />
      </form>
      
      {/* כפתור מעבר מהיר לעמוד ההרשמה במידה ולמשתמש אין עדיין חשבון */}
      <p style={{ marginTop: '15px' }}>
        Don't have an account? <span style={{ color: '#1a73e8', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/')}>Register here</span>
      </p>
    </div>
  );
};

export default Login;
