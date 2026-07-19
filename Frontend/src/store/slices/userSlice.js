import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  name: null,
  email: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Fnc to save user in case of login and registration.
    setUser: (state, action) => {
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.isAuthenticated = true;
    },
    // Cleanup function for logout.
    logoutUser: (state) => {
      state.name = null;
      state.email = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logoutUser } = userSlice.actions;
export default userSlice.reducer;