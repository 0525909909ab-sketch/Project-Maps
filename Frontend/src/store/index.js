import { configureStore } from "@reduxjs/toolkit"
import userReducer from "./slices/userSlice"

const store = configureStore({
  reducer: {
    user: userReducer,
    // TODO: In future we can add here map: mapReducer (All locations saved and state of filters like show only my points) and so on...
  },
})

export default store
