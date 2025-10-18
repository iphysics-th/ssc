import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "../features/auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_BACKEND_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.user?.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401 && !(args?.skipAuthRefresh || extraOptions?.skipAuthRefresh)) {
    // Attempt to refresh token
    const refreshResult = await baseQuery(
      { url: "api/auth/refreshtoken", method: "GET" },
      api,
      { ...extraOptions, skipAuthRefresh: true }
    );

    if (refreshResult?.data) {
      api.dispatch(userLoggedIn({ user: refreshResult.data }));
      // Retry original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(userLoggedOut());
    }
  }

  return result;
};

// Main RTK Query API slice
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "User",
    "Reservation",
    "Reservations",
    "Subjects",
    "Slides",
    "AdminUsers",
    "Lecturers",
  ],
  endpoints: () => ({}),
});

// Periodic refresh helper (runs every X minutes)
export const setupPeriodicTokenRefresh = (dispatch, intervalMs = 15 * 60 * 1000) => {
  setInterval(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/refreshtoken`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data?.token) {
        dispatch(userLoggedIn({ user: data }));
      } else {
        dispatch(userLoggedOut());
      }
    } catch (err) {
      console.error("🔁 Token refresh failed:", err);
      dispatch(userLoggedOut());
    }
  }, intervalMs);
};
