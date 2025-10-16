import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: "", // Since you're using httpOnly cookies, this might not be used.
  user: "",
  isAuthenticated: false,
  signupStatus: 'idle', // 'idle', 'loading', 'succeeded', 'failed'
  signupError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userLoggedIn: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true; // Set isAuthenticated to true upon login
      // Optionally reset signup state upon successful login
      state.signupStatus = 'idle';
      state.signupError = null;
    },
    userLoggedOut: (state) => {
      state.token = "";
      state.user = "";
      state.isAuthenticated = false; // Reset isAuthenticated upon logout
    },
    // Adding new reducers for signup process
    signupStarted: (state) => {
      state.signupStatus = 'loading';
      state.signupError = null; // Reset signup error when a new signup process starts
    },
    signupSucceeded: (state) => {
      state.signupStatus = 'succeeded';
      // You might not want to automatically set isAuthenticated to true here
      // depending on your application's signup and login flow
    },
    signupFailed: (state, action) => {
      state.signupStatus = 'failed';
      state.signupError = action.payload.error; // Store the error message
    },
  },
});

export const { userLoggedIn, userLoggedOut, signupStarted, signupSucceeded, signupFailed } = authSlice.actions;

export default authSlice.reducer;
