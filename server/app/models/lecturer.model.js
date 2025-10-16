const mongoose = require("mongoose");

module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        name_th: String,
        surname_th: String,
        position_th: String,
        name_en: String,
        surname_en: String,
        position_en: String,
        division_en: String,
        division_th: String,
        program: String,
        image: String,
        doctoral: String,
        doctoral_year: Number,
        master: String,
        master_year: Number,
        bachelor: [String], // Array of strings for sub-parameters
        bachelor_year: [Number], // Array of numbers for sub-parameters
        specialty: [String], // Array of strings for sub-parameters
        industrial: [String], // Array of strings for sub-parameters
        paper: [String], // Array of strings for sub-parameters
        grant: [String], // Array of strings for sub-parameters
        patent: [String], // Array of strings for sub-parameters
        email: String
      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Lecturer = mongoose.model("lecturer", schema);
    return Lecturer;
};



