const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: Date,
  time: String,
  category:String,
  subject: String
});

const reservationSchema = new mongoose.Schema({
  numberOfDays: Number,
  numberOfStudents: Number,
  name: String,
  surname: String,
  prefix: String,
  status: String,
  telephone: String,
  email: String,
  school: String,
  schoolSize: String,
  reservationNumber: String,
  price: Number,
  selectedDates: [Date],
  slotSelections: [slotSchema], // Use the new schema for slots
  confirmation: {
    type: String,
    enum: ['received', 'processed', 'confirmed'],
    default: 'received', // Set 'received' as the default value
    required: true // Make this field required
  }
});

module.exports = mongoose.model('Reservation', reservationSchema);
