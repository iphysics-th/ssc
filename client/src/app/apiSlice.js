import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_BACKEND_URL,
  credentials: "include",
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401 && !(args?.skipAuthRefresh || extraOptions?.skipAuthRefresh)) {
    const refreshResult = await baseQuery(
      { url: "api/auth/refreshtoken", method: "GET" },
      api,
      { ...extraOptions, skipAuthRefresh: true }
    );

    if (refreshResult?.error) {
      return result;
    }

    result = await baseQuery(args, api, extraOptions);
  }

  return result;
};

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
