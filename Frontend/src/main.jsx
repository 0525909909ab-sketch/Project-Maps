import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import store from "./store"
import App from "./App.jsx"
import { MapProvider } from "./context/mapContext.jsx"
import "./index.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <MapProvider>
        <App />
      </MapProvider>
    </Provider>
  </StrictMode>,
)
