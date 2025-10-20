import { apiSlice } from "../../app/apiSlice";

export const reservationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getConfirmedReservations: builder.query({
      query: () => ({
        url: "api/reservation/confirmed",
        method: "GET",
      }),
      providesTags: ["Reservations"],
    }),
    getMyReservations: builder.query({
      query: () => ({
        url: "api/reservation/my",
        method: "GET",
      }),
      providesTags: ["Reservations"],
    }),
    getReservationsByEmail: builder.query({
      query: ({ email, username }) => ({
        url: "api/reservation/by-email",
        method: "GET",
        params: {
          email,
          username,
        },
      }),
      providesTags: ["Reservations"],
    }),
    checkReservationNumber: builder.query({
      query: (reservationNumber) => ({
        url: `api/reservation/check/${reservationNumber}`,
        method: "GET",
      }),
    }),
    createReservation: builder.mutation({
      query: (body) => ({
        url: "api/reservation/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Reservations"],
    }),
    searchReservation: builder.query({
      query: (reservationNumber) => ({
        url: "api/reservation/search",
        method: "GET",
        params: { reservationNumber },
      }),
    }),
    getReservationTable: builder.query({
      query: ({ page = 1, limit = 100 } = {}) => ({
        url: "api/reservation/reservation-table",
        method: "GET",
        params: { page, limit },
      }),
      providesTags: ["Reservations"],
    }),
    updateReservationStatus: builder.mutation({
      query: ({ id, field, value }) => ({
        url: "api/reservation/update-status",
        method: "PUT",
        body: { id, field, value },
      }),
      invalidatesTags: ["Reservations"],
    }),
    getSubjectLevels: builder.query({
      query: () => ({
        url: "api/subject",
        method: "GET",
      }),
      providesTags: ["Subjects"],
    }),
    getSubjectsByLevel: builder.query({
      query: (level) => ({
        url: `api/subject/${level}`,
        method: "GET",
      }),
      providesTags: ["Subjects"],
    }),
    getSubjectsByCategory: builder.query({
      query: ({ level, category }) => ({
        url: `api/subject/${level}/${category}`,
        method: "GET",
      }),
      providesTags: ["Subjects"],
    }),
    getSubjectsBySubcategory: builder.query({
      query: ({ level, category, subcategory }) => ({
        url: `api/subject/${level}/${category}/${subcategory}`,
        method: "GET",
      }),
      providesTags: (result = []) => [
        { type: "Subjects", id: "LIST" },
        ...result.map((item) => ({ type: "Subjects", id: item.id })),
      ],
    }),
    getSubjectDetail: builder.query({
      query: (id) => ({
        url: `api/admin/subjects/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Subjects", id }],
    }),
    createSubject: builder.mutation({
      query: (data) => ({
        url: "api/admin/subjects",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Subjects", id: "LIST" }],
    }),
    updateSubject: builder.mutation({
      query: ({ id, data }) => ({
        url: `api/admin/subjects/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Subjects", id },
        { type: "Subjects", id: "LIST" },
      ],
    }),
    updateSubjectStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `api/admin/subjects/${id}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Subjects", id },
        { type: "Subjects", id: "LIST" },
      ],
    }),
    deleteSubject: builder.mutation({
      query: (id) => ({
        url: `api/admin/subjects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Subjects", id: "LIST" }],
    }),
    updateCategoryStatus: builder.mutation({
      query: (body) => ({
        url: "api/admin/categories/status",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Subjects", id: "LIST" }],
    }),
    updateSubcategoryStatus: builder.mutation({
      query: (body) => ({
        url: "api/admin/subcategories/status",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Subjects", id: "LIST" }],
    }),
    getReservationRules: builder.query({
      query: () => ({
        url: "api/reservation/unavailable",
        method: "GET",
      }),
      providesTags: ["ReservationRules"],
    }),
    getReservationRulesAdmin: builder.query({
      query: () => ({
        url: "api/admin/reservation-rules",
        method: "GET",
      }),
      providesTags: ["ReservationRules"],
    }),
    createReservationRule: builder.mutation({
      query: (body) => ({
        url: "api/admin/reservation-rules",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ReservationRules"],
    }),
    deleteReservationRule: builder.mutation({
      query: (id) => ({
        url: `api/admin/reservation-rules/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ReservationRules"],
    }),
  }),
});

export const {
  useGetConfirmedReservationsQuery,
  useGetMyReservationsQuery,
  useGetReservationsByEmailQuery,
  useLazyGetReservationsByEmailQuery,
  useCheckReservationNumberQuery,
  useLazyCheckReservationNumberQuery,
  useCreateReservationMutation,
  useSearchReservationQuery,
  useLazySearchReservationQuery,
  useGetReservationTableQuery,
  useUpdateReservationStatusMutation,
  useGetSubjectLevelsQuery,
  useGetSubjectsByLevelQuery,
  useLazyGetSubjectsByLevelQuery,
  useGetSubjectsByCategoryQuery,
  useLazyGetSubjectsByCategoryQuery,
  useGetSubjectsBySubcategoryQuery,
  useLazyGetSubjectsBySubcategoryQuery,
  useGetSubjectDetailQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useUpdateSubjectStatusMutation,
  useDeleteSubjectMutation,
  useUpdateCategoryStatusMutation,
  useUpdateSubcategoryStatusMutation,
  useGetReservationRulesQuery,
  useGetReservationRulesAdminQuery,
  useCreateReservationRuleMutation,
  useDeleteReservationRuleMutation,
} = reservationApiSlice;
