import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "../features/auth/authSlice";

// ---------------------------------------------------------
// 🔹 Base Query Setup
// ---------------------------------------------------------
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_BACKEND_URL,
  credentials: "include", // ✅ needed for cookies
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

  if (
    result?.error?.status === 401 &&
    !(args?.skipAuthRefresh || extraOptions?.skipAuthRefresh)
  ) {
    console.warn("🔁 Access token expired — attempting refresh...");

    // ✅ Try to refresh the token
    const refreshResult = await baseQuery(
      { url: "/api/auth/refreshtoken", method: "GET" },
      api,
      { ...extraOptions, skipAuthRefresh: true }
    );

    if (refreshResult?.data) {
      const refreshedUser = refreshResult.data.user;
      const newAccessToken = refreshResult.data.accessToken;

      if (refreshedUser && newAccessToken) {
        api.dispatch(
          userLoggedIn({
            ...refreshedUser,
            token: newAccessToken,
          })
        );
        console.log("✅ Token refreshed successfully");
      } else {
        console.warn("⚠️ Refresh succeeded but missing user or token field");
      }

      // Retry original request
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
  "ReservationRules",
  "Settings",
  ],
  endpoints: () => ({}),
});

// ---------------------------------------------------------
// 🔹 Periodic Token Refresh (every X minutes)
// ---------------------------------------------------------
export const setupPeriodicTokenRefresh = (
  dispatch,
  intervalMs = 4 * 60 * 1000 // ✅ refresh every 4 minutes (safer than 15)
) => {
  setInterval(async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/refreshtoken`,
        {
          method: "GET",
          credentials: "include", // ✅ ensure cookies are sent
        }
      );

      const data = await response.json();

      if (response.ok && data?.user && data?.accessToken) {
        dispatch(
          userLoggedIn({
            ...data.user,
            token: data.accessToken,
          })
        );
        console.log("🔄 Token refreshed periodically for:", data.user.username);
      } else {
        console.warn("⚠️ Periodic token refresh failed — logging out");
        dispatch(userLoggedOut());
      }
    } catch (err) {
      console.error("❌ Periodic token refresh failed:", err);
      dispatch(userLoggedOut());
    }
  }, intervalMs);
};
