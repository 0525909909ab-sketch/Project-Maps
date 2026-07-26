import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  id: null, // הוספת שדה מזהה
  name: null,
  email: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.id = action.payload.id || action.payload._id; 
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.isAuthenticated = true;
    },
    logoutUser: (state) => {
      state.id = null; 
      state.name = null;
      state.email = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logoutUser } = userSlice.actions;
export default userSlice.reducer;