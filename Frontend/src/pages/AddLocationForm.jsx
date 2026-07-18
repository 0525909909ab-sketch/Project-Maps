import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { addUsersLocationApi } from '../api/general';

const AddLocationForm = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [geoError, setGeoError] = useState(""); // סטייט חדש לשגיאות GPS
  const [isSubmittingState, setIsSubmittingState] = useState(false);
  const [isLocating, setIsLocating] = useState(false); // סטייט חדש לטעינת המיקום

  const {
    register,
    handleSubmit,
    setValue, // פונקציה חדשה שחולצה כדי לאפשר לנו לעדכן שדות בצורה ידנית
    formState: { errors },
    reset
  } = useForm();

  // פונקציה חדשה לשליפת מיקום ה-GPS של המשתמש והזרקתו לטופס
  const handleGetCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("הדפדפן שלך אינו תומך בשירותי מיקום.");
      return;
    }

    setIsLocating(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // הזרקת הערכים לשדות ה-Latitude וה-Longitude של react-hook-form
        setValue("latitude", position.coords.latitude, { shouldValidate: true });
        setValue("longitude", position.coords.longitude, { shouldValidate: true });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        if (error.code === 1) {
          setGeoError("גישת ה-GPS נדחתה. אנא אשר שירותי מיקום בדפדפן.");
        } else {
          setGeoError("לא ניתן היה לקבוע את המיקום הנוכחי שלך.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 } // הגדרות דיוק מירבי
    );
  };

  const onSubmit = async (data) => {
    try {
      setApiError("");
      setIsSubmittingState(true);

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("latitude", parseFloat(data.latitude));
      formData.append("longitude", parseFloat(data.longitude));

      if (data.image && data.image.length > 0) {
        formData.append("image", data.image[0]);
      }

      await addUsersLocationApi(formData);
      
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

        {/* שדה הוספת תמונה */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="image" style={{ display: 'block', marginBottom: '5px' }}>הוסף תמונה (אופציונלי):</label>
          <input 
            id="image"
            type="file"
            accept="image/*"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            {...register("image")} 
          />
        </div>

        {/* --- הכפתור החדש למשיכת מיקום אוטומטית --- */}
        <div style={{ marginBottom: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <button
            type="button" // חשוב מאוד כדי שהלחיצה לא תגיש את הטופס בטעות
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#34a853',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {isLocating ? "מזהה מיקום..." : "📍 השתמש במיקום הנוכחי שלי"}
          </button>
          {geoError && <p style={{ color: 'orange', margin: '5px 0 0 0', fontSize: '13px', fontWeight: 'bold' }}>{geoError}</p>}
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
