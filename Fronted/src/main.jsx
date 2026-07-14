import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
<<<<<<< HEAD
import App from './App.jsx'
import 'mapbox-gl/dist/mapbox-gl.css';

=======
import './index.css'
import App from './App.jsx'
>>>>>>> origin/main

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
