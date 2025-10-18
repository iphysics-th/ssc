const mongoose = require("mongoose");

module.exports = mongoose => {
  var schema = mongoose.Schema({
    name_th: { type: String, required: true },
    code: { type: String, required: true },
    slot: { type: Number, required: true },
    level_th: { type: String, required: true },
    level_en: { type: String, required: true },
    category_th: { type: String, required: true },
    category_en: { type: String, required: true },
    subcategory_th: { type: String, required: true },
    subcategory_en: { type: String, required: true },
    description_th: { type: [String], required: true },
    student_max: { type: Number, required: true },
    total_classrooms: { type: Number, default: 1 },
    price: { type: Number, default: null },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true }
  }, {
    timestamps: true
  });

  schema.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Subject = mongoose.model("Subject", schema);
  return Subject;
};
