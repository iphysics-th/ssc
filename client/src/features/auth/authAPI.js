import { apiSlice } from "../../app/apiClient";
import { userLoggedIn, userLoggedOut, signupStarted, signupSucceeded, signupFailed } from "./authSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: "/api/auth/signin",
        method: "POST",
        body: {
          email,
          password,
        },
        credentials: "include",
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(userLoggedIn({
            user: result.data // Assuming result.data contains the user info you need
          }));
        } catch (error) {
          console.log(error);
        }
      },
    }),
    signUp: builder.mutation({
      query: ({ username, email, password, roles, recaptchaToken }) => ({
        url: "/api/auth/signup",
        method: "POST",
        body: {
          username,
          email,
          password,
          roles: ["member"], // Set the role to "member" by default
          recaptchaToken,
        },
      }),
      async onQueryStarted(arg, { dispatch }) {
        // Indicate that the signup process has started
        dispatch(signupStarted());
        try {
          const result = await arg.queryFulfilled;
          dispatch(signupSucceeded());
          dispatch(userLoggedIn({
            user: result.data // Assuming result.data contains the user info you need
          }));
        } catch (error) {
          dispatch(signupFailed({ error: error.toString() }));
          console.error('Signup failed:', error);
        }
      },
    }),
    logOut: builder.mutation({
      query: () => ({
        url: "/api/auth/signout",
        method: "POST",
        credentials: "include",
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
          dispatch(userLoggedOut());
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },
    }),
    // Adding the socialAuth mutation
    // Assuming the rest of the authApi setup remains unchanged
    socialAuth: builder.mutation({
      query: ({ email, name, picture }) => ({
        url: "/api/auth/social-auth",
        method: "POST",
        body: {
          email,
          name,
          picture
        }, // Directly pass the object, RTK Query will stringify it if needed
        credentials: "include",
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          // Assuming result.data contains the user info and tokens you need
          dispatch(userLoggedIn({
            user: result.data // Update the state with the user info
          }));
          // Optionally handle tokens here if needed
        } catch (error) {
          console.error('Social sign-in failed:', error);
          // Optionally, dispatch a specific action for social sign-in failure
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useSignUpMutation, // To use the signUp mutation
  useLogOutMutation,
  useSocialAuthMutation, // Add this line to use the socialAuth mutation
} = authApi;
