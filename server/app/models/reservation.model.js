const mongoose = require("mongoose");


const Mixed = mongoose.Schema.Types.Mixed;

const slotSchema = new mongoose.Schema({
  slotIndex: Number,
  date: Date,
  time: String,
  slot: String,
  code: String,
  name_th: String,
  classNumber: Number,
  subject: Mixed,
  level: String,
  levelLabel: String,
  category: String,
  categoryLabel: String,
  subcategory: String,
  subcategoryLabel: String
}, { _id: false });

const classSlotSchema = new mongoose.Schema({
  slotIndex: Number,
  date: Date,
  slot: String,
  subject: Mixed,
  code: String,
  name_th: String,
  level: String,
  levelLabel: String,
  category: String,
  categoryLabel: String,
  subcategory: String,
  subcategoryLabel: String
}, { _id: false });

module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      numberOfDays: Number,
      numberOfStudents: Number,
      studentRange: String,
      studentLevel: Number,
      name: String,
      surname: String,
      prefix: String,
      status: String,
      telephone: String,
      mail: String, // Ensure this is intended to be 'mail' and not 'email'
      school: String,
      schoolSize: String,
      reservationNumber: String,
      price: Number,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
      selectedDates: [Date],
      classSubjects: [new mongoose.Schema({
        classNumber: Number,
        code: String,
        name_th: String,
        level: String,
        levelLabel: String,
        category: String,
        categoryLabel: String,
        subcategory: String,
        subcategoryLabel: String,
        date: Date,
        slot: String,
        slots: [classSlotSchema]
      }, { _id: false })],
      slotSelections: [slotSchema],
      userInfo: {
        username: String,
        email: String,
      },
      confirmation: {
        type: String,
        enum: ['received', 'processed', 'confirmed', 'canceled'],
        default: 'received',
        required: true
      }
    },
    { timestamps: true } // Enable created and updated timestamps
  );

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Reservation = mongoose.model("reservation", schema);
  return Reservation;
};
