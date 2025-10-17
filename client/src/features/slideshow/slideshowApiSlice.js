import { apiSlice } from "../../app/apiSlice";

export const slideshowApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSlide: builder.query({
      query: (slideNumber) => ({
        url: `api/slide/${slideNumber}`,
        method: "GET",
      }),
      providesTags: (result, error, slideNumber) => [
        { type: "Slides", id: slideNumber },
      ],
    }),
    updateSlide: builder.mutation({
      query: ({ slideNumber, formData }) => ({
        url: `api/slide/${slideNumber}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { slideNumber }) => [
        { type: "Slides", id: slideNumber },
      ],
    }),
  }),
});

export const { useGetSlideQuery, useLazyGetSlideQuery, useUpdateSlideMutation } =
  slideshowApiSlice;

