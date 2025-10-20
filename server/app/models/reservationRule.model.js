module.exports = (mongoose) => {
  const schema = new mongoose.Schema(
    {
      type: {
        type: String,
        enum: ["weekday", "date_range", "subcategory"],
        required: true,
      },
      weekdays: {
        type: [Number],
        default: [],
      },
      startDate: Date,
      endDate: Date,
      level_en: String,
      category_en: String,
      subcategory_en: String,
      note: String,
    },
    { timestamps: true }
  );

  return mongoose.model("ReservationRule", schema);
};
