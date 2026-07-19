import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    // TODO: In future we can add here map: mapReducer and so on...
  },
});

export default store;