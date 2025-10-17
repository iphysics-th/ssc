import { apiSlice } from "../../app/apiSlice";

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({
        url: "api/admin/users",
        method: "GET",
      }),
      providesTags: (result = []) => [
        { type: "AdminUsers", id: "LIST" },
        ...result.map((user) => ({ type: "AdminUsers", id: user?.id ?? user?._id })),
      ],
    }),
    updateUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `api/admin/users/${userId}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "AdminUsers", id: userId },
        { type: "AdminUsers", id: "LIST" },
      ],
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `api/admin/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, userId) => [
        { type: "AdminUsers", id: userId },
        { type: "AdminUsers", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} = adminApiSlice;

