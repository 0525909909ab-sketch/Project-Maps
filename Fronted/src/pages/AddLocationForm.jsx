import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { addUsersLocationApi } from '../api/general';

const AddLocationForm = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [isSubmittingState, setIsSubmittingState] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setApiError("");
      setIsSubmittingState(true);

      // המרת ערכי הקואורדינטות מטקסט למספר עשרוני (Float) כפי שהשרת מצפה לקבל
      const payload = {
        name: data.name,
        description: data.description || "",
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude)
      };

      // שליחת הנתונים לשרת ה-FastAPI
      await addUsersLocationApi(payload);
      
      // איפוס הטופס ומעבר חזרה לעמוד המפה כדי לראות את הנקודה החדשה
      reset();
      navigate('/map');
    } catch (error) {
      console.error("Error adding location:", error);
      setApiError("הוספת המיקום נכשלה. אנא ודא שהשרת רץ ושהערכים תקינים.");
    } finally {
      setIsSubmittingState(false);
    }
  };

  return (
    <div className="Add-Location-Page" style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif', direction: 'rtl', textAlign: 'right' }}>
      <h2>הוספת מיקום חדש למפה 📍</h2>
      
      {apiError && <p className="error-msg" style={{ color: 'red', fontWeight: 'bold' }}>{apiError}</p>}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* שדה שם המקום */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>שם המקום:</label>
          <input 
            id="name"
            type="text"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            {...register("name", { required: "שם המקום הוא שדה חובה", maxLength: 50 })} 
          />
          {errors.name && <p style={{ color: 'red', margin: '5px 0 0 0', fontSize: '13px' }}>{errors.name.message}</p>}
        </div>

        {/* שדה תיאור המקום */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>תיאור / הערות:</label>
          <textarea 
            id="description"
            rows="3"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', resize: 'vertical' }}
            {...register("description")} 
          />
        </div>

        {/* שדה קו רוחב Latitude */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="latitude" style={{ display: 'block', marginBottom: '5px' }}>קו רוחב (Latitude):</label>
          <input 
            id="latitude"
            type="number" 
            step="any"
            placeholder="לדוגמה: 32.8100"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', direction: 'ltr', textAlign: 'right' }}
            {...register("latitude", { 
              required: "קו רוחב הוא שדה חובה",
              validate: value => !isNaN(parseFloat(value)) || "חובה להזין מספר תקין"
            })} 
          />
          {errors.latitude && <p style={{ color: 'red', margin: '5px 0 0 0', fontSize: '13px' }}>{errors.latitude.message}</p>}
        </div>

        {/* שדה קו אורך Longitude */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="longitude" style={{ display: 'block', marginBottom: '5px' }}>קו אורך (Longitude):</label>
          <input 
            id="longitude"
            type="number" 
            step="any"
            placeholder="לדוגמה: 35.5300"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', direction: 'ltr', textAlign: 'right' }}
            {...register("longitude", { 
              required: "קו אורך הוא שדה חובה",
              validate: value => !isNaN(parseFloat(value)) || "חובה להזין מספר תקין"
            })} 
          />
          {errors.longitude && <p style={{ color: 'red', margin: '5px 0 0 0', fontSize: '13px' }}>{errors.longitude.message}</p>}
        </div>

        {/* כפתורי פעולה */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="submit" 
            value={isSubmittingState ? "שומר..." : "שמור מיקום"} 
            disabled={isSubmittingState}
            style={{ padding: '10px 20px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
          />
          <button 
            type="button" 
            onClick={() => navigate('/map')}
            style={{ padding: '10px 20px', backgroundColor: '#ccc', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLocationForm;
