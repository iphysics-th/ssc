module.exports = (mongoose) => {
  const schema = new mongoose.Schema(
    {
      level_en: { type: String, required: true },
      category_en: { type: String, required: true },
      category_th: { type: String, default: "" },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

  schema.index({ level_en: 1, category_en: 1 }, { unique: true });

  return mongoose.model("CategoryStatus", schema);
};
