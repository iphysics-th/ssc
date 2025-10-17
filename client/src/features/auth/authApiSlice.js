import { apiSlice } from "../../app/apiSlice";
import {
  signupFailed,
  signupStarted,
  signupSucceeded,
  userLoggedIn,
  userLoggedOut,
} from "./authSlice";

const extractErrorMessage = (error) => {
  if (!error) {
    return "Unexpected error";
  }

  if (typeof error === "string") {
    return error;
  }

  const dataMessage = error?.data?.message;
  if (typeof dataMessage === "string" && dataMessage.trim() !== "") {
    return dataMessage;
  }

  const statusText = error?.statusText;
  if (typeof statusText === "string" && statusText.trim() !== "") {
    return statusText;
  }

  if (error?.error) {
    return extractErrorMessage(error.error);
  }

  return "Unexpected error";
};

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: "api/auth/signin",
        method: "POST",
        body: { email, password },
      }),
      invalidatesTags: ["Auth", "User"],
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            userLoggedIn({
              user: data,
            })
          );
        } catch (error) {
          console.error("Login failed:", error);
        }
      },
    }),
    signUp: builder.mutation({
      query: ({ username, email, password, recaptchaToken }) => ({
        url: "api/auth/signup",
        method: "POST",
        body: {
          username,
          email,
          password,
          roles: ["member"],
          recaptchaToken,
        },
      }),
      invalidatesTags: ["Auth", "User"],
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        dispatch(signupStarted());
        try {
          const { data } = await queryFulfilled;
          dispatch(signupSucceeded());
          dispatch(
            userLoggedIn({
              user: data,
            })
          );
        } catch (error) {
          const message = extractErrorMessage(error);
          dispatch(signupFailed({ error: message }));
          console.error("Signup failed:", error);
        }
      },
    }),
    logOut: builder.mutation({
      query: () => ({
        url: "api/auth/signout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
          dispatch(userLoggedOut());
        } catch (error) {
          console.error("Logout failed:", error);
        }
      },
    }),
    socialAuth: builder.mutation({
      query: ({ email, name, picture }) => ({
        url: "api/auth/social-auth",
        method: "POST",
        body: { email, name, picture },
      }),
      invalidatesTags: ["Auth", "User"],
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            userLoggedIn({
              user: data,
            })
          );
        } catch (error) {
          console.error("Social sign-in failed:", error);
        }
      },
    }),
    refreshToken: builder.query({
      query: () => ({
        url: "api/auth/refreshtoken",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),
    loadUser: builder.query({
      query: () => ({
        url: "api/auth/me",
        method: "GET",
      }),
      providesTags: ["Auth", "User"],
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            dispatch(
              userLoggedIn({
                user: data,
              })
            );
          }
        } catch (error) {
          console.error("Failed to load user:", error);
        }
      },
    }),
    getAdminStatus: builder.query({
      query: () => ({
        url: "api/user/admin",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),
    getUserProfile: builder.query({
      query: () => ({
        url: "api/user/profile",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    updateUserProfile: builder.mutation({
      query: (body) => ({
        url: "api/user/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignUpMutation,
  useLogOutMutation,
  useSocialAuthMutation,
  useRefreshTokenQuery,
  useLoadUserQuery,
  useLazyLoadUserQuery,
  useGetAdminStatusQuery,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} = authApiSlice;
