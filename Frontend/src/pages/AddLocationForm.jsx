import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { addUsersLocationApi } from '../api/general';
import GlobalMap from '../features/map/GlobalMap';
import { useAuth } from '../context/authContext'; 

const AddLocationForm = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [geoError, setGeoError] = useState(""); 
  const [isSubmittingState, setIsSubmittingState] = useState(false);

  const { 
    findUserLocations, 
    userPosition, 
    pinnedLocation, 
    setPinnedLocation,
    setLocations 
  } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  // 👈 תיקון 1: האזנה לשינוי ב-userPosition ועדכון ה-Pinned Location ברגע שהוא נתפס
  useEffect(() => {
    if (userPosition && userPosition.latitude && userPosition.longitude) {
      setPinnedLocation({ 
        latitude: userPosition.latitude, 
        longitude: userPosition.longitude 
      });
      setGeoError("");
    }
  }, [userPosition, setPinnedLocation]);

  const handleGetCurrentLocation = async () => {
    setGeoError("");
    try {
      // הפעלת פונקציית האיתור - ה-useEffect למעלה יעשה את השאר ברגע שהמיקום יגיע
      await findUserLocations(); 
    } catch (error) {
      console.error("GPS Error:", error);
      setGeoError("לא ניתן היה לקבוע את המיקום הנוכחי שלך. חפש במפה.");
    }
  };

  const onSubmit = async (data) => {
    if (!pinnedLocation) {
      setApiError("חובה לבחור מיקום על גבי המפה או באמצעות ה-GPS לפני השמירה!");
      return;
    }

    try {
      setApiError("");
      setIsSubmittingState(true);

      // 👈 תיקון 2: יצירת FormData בצורה מובנית ובטוחה
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("description", (data.description || "").trim());
      formData.append("latitude", String(pinnedLocation.latitude));
      formData.append("longitude", String(pinnedLocation.longitude));

      if (data.image && data.image.length > 0) {
        formData.append("image", data.image[0]);
      }

      // 1. שליחה לשרת 
      const response = await addUsersLocationApi(formData);
      
      // 👈 תיקון 3: שליפת הנתונים הנכונה מהתגובה
      const newSavedLocation = response?.data?.data || response?.data || response;
      
      // 2. עדכון ה-State המקומי במיקום החדש כדי שיופיע במפה מיד
      if (newSavedLocation && setLocations) {
        setLocations(prev => Array.isArray(prev) ? [...prev, { ...newSavedLocation, isCreatedByUser: true }] : [newSavedLocation]);
      }

      // 3. איפוס וניווט בחזרה למפה
      setPinnedLocation(null);
      reset();
      navigate('/map');
    } catch (error) {
      console.error("Error adding location:", error);
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error || "הוספת המיקום נכשלה. בדוק את חיבור השרת.";
      setApiError(serverMessage);
    } finally {
      setIsSubmittingState(false);
    }
  };

  return (
    <div className="Add-Location-Page" style={{ padding: '20px', maxWidth: '450px', margin: '0 auto', fontFamily: 'sans-serif', direction: 'rtl', textAlign: 'right' }}>
      <h2>הוספת מיקום חדש למפה 📍</h2>
      
      {apiError && <p style={{ color: 'red', fontWeight: 'bold', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px' }}>{apiError}</p>}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* שם המקום */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>שם המקום:</label>
          <input 
            id="name"
            type="text"
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            {...register("name", { required: "שם המקום הוא שדה חובה", maxLength: 50 })} 
          />
          {errors.name && <p style={{ color: 'red', margin: '5px 0 0 0', fontSize: '13px' }}>{errors.name.message}</p>}
        </div>

        {/* תיאור המקום */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>תיאור / הערות:</label>
          <textarea 
            id="description"
            rows="3"
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
            {...register("description")} 
          />
        </div>

        {/* הוספת תמונה */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="image" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>הוסף תמונה (אופציונלי):</label>
          <input 
            id="image"
            type="file"
            accept="image/*"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            {...register("image")} 
          />
        </div>

        {/* כפתור מיקום GPS */}
        <div style={{ marginBottom: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <button
            type="button" 
            onClick={handleGetCurrentLocation}
            style={{ width: '100%', padding: '10px', backgroundColor: '#34a853', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            📍 השתמש במיקום הנוכחי שלי
          </button>
          {geoError && <p style={{ color: 'orange', margin: '5px 0 0 0', fontSize: '13px', fontWeight: 'bold' }}>{geoError}</p>}
        </div>

        {/* באנר חיווי ויזואלי למצב הנקודה */}
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px', textAlign: 'center' }}>
          {pinnedLocation ? (
            <p style={{ color: 'green', margin: 0, fontWeight: 'bold' }}>
              ✔️ המיקום נקלט: {Number(pinnedLocation.latitude).toFixed(4)}, {Number(pinnedLocation.longitude).toFixed(4)}
            </p>
          ) : (
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
              טרם נבחר מיקום. השתמש בכפתור למעלה או לחץ לחיצה כפולה על המפה למטה.
            </p>
          )}
        </div>

        {/* כפתורי פעולה */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <button 
            type="submit" 
            disabled={isSubmittingState}
            style={{ padding: '12px 20px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}
          >
            {isSubmittingState ? "שומר..." : "שמור מיקום"}
          </button>
          <button 
            type="button" 
            onClick={() => {
              setPinnedLocation(null);
              navigate('/map');
            }}
            style={{ padding: '12px 20px', backgroundColor: '#ccc', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ביטול
          </button>
        </div>
      </form>

      {/* מפה לבחירת נקודה */}
      <div className='global-map' style={{ marginTop: '20px', height: '350px', width: '100%', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
        <GlobalMap showOnlyUserLocations={true} />
      </div>
    </div>
  );
};

export default AddLocationForm;