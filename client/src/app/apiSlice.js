import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "../features/auth/authSlice";

// ---------------------------------------------------------
// 🔹 Base Query Setup
// ---------------------------------------------------------
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_BACKEND_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.user?.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// ---------------------------------------------------------
// 🔹 Base Query with Automatic Token Refresh
// ---------------------------------------------------------
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // If access token expired or invalid
  if (
    result?.error?.status === 401 &&
    !(args?.skipAuthRefresh || extraOptions?.skipAuthRefresh)
  ) {
    console.warn("🔁 Access token expired — attempting refresh...");

    // Attempt to refresh token
    const refreshResult = await baseQuery(
      { url: "api/auth/refreshtoken", method: "GET" },
      api,
      { ...extraOptions, skipAuthRefresh: true }
    );

    if (refreshResult?.data) {
      const refreshedUser = refreshResult.data.user;
      const newAccessToken = refreshResult.data.accessToken;

      if (refreshedUser && newAccessToken) {
        // ✅ Correctly flatten and update Redux state
        api.dispatch(
          userLoggedIn({
            ...refreshedUser,
            token: newAccessToken,
          })
        );
      } else {
        console.warn("⚠️ Refresh succeeded but missing user or token field");
      }

      // Retry original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      console.error("❌ Refresh token invalid — logging out");
      api.dispatch(userLoggedOut());
    }
  }

  return result;
};

// ---------------------------------------------------------
// 🔹 RTK Query API Slice
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 🔹 Periodic Token Refresh (every X minutes)
// ---------------------------------------------------------
export const setupPeriodicTokenRefresh = (
  dispatch,
  intervalMs = 15 * 60 * 1000 // default 15 minutes
) => {
  setInterval(async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/refreshtoken`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      // ✅ Correctly handle structure from backend
      if (response.ok && data?.user && data?.accessToken) {
        dispatch(
          userLoggedIn({
            ...data.user,
            token: data.accessToken,
          })
        );
        console.log("🔄 Token refreshed successfully:", data.user.username);
      } else {
        console.warn("⚠️ Token refresh failed — logging out");
        dispatch(userLoggedOut());
      }
    } catch (err) {
      console.error("❌ Periodic token refresh failed:", err);
      dispatch(userLoggedOut());
    }
  }, intervalMs);
};
