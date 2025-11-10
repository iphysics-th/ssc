module.exports = (mongoose) => {
  const schema = new mongoose.Schema(
    {
      key: { type: String, required: true, unique: true },
      value: { type: mongoose.Schema.Types.Mixed, required: true },
      description: { type: String, default: "" },
    },
    {
      timestamps: true,
    }
  );

  return mongoose.model("Setting", schema);
};
