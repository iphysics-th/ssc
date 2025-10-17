import { apiSlice } from "../../app/apiSlice";

export const lecturerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDivisions: builder.query({
      query: () => ({
        url: "api/lecturer/divisions",
        method: "GET",
      }),
      providesTags: ["Lecturers"],
      transformResponse: (response) =>
        Array.isArray(response)
          ? [...response].sort((a, b) =>
              String(a?.division_th || "").localeCompare(
                String(b?.division_th || ""),
                "th"
              )
            )
          : response,
    }),
    getDivisionDetails: builder.query({
      query: (division) => ({
        url: `api/lecturer/divisions/${division}`,
        method: "GET",
      }),
      providesTags: ["Lecturers"],
      transformResponse: (response) =>
        Array.isArray(response)
          ? [...response].sort(
              (a, b) => Number(a?.bachelor_year || 0) - Number(b?.bachelor_year || 0)
            )
          : response,
    }),
    getLecturerProfile: builder.query({
      query: ({ division, name }) => ({
        url: `api/lecturer/divisions/${division}/${name}`,
        method: "GET",
      }),
      providesTags: ["Lecturers"],
    }),
  }),
});

export const {
  useGetDivisionsQuery,
  useGetDivisionDetailsQuery,
  useGetLecturerProfileQuery,
} = lecturerApiSlice;

