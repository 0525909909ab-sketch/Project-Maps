import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Map3D from './features/map/Map';

function App() {
  const [status, setStatus] = useState('בודק חיבור ל-Supabase...');

  useEffect(() => {
    async function checkConnection() {
      // מנסה לעשות פעולה פשוטה מול Supabase כדי לראות שיש תקשורת
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus(`שגיאת חיבור: ${error.message}`);
      } else {
        setStatus('החיבור ל-Supabase עובד ומגיב מעולה!');
      }
    }
    checkConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
       <h1>בדיקת פרויקט מפות</h1>
       <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{status}</p>
       <Map3D />
    </div>
  );
}

export default App;