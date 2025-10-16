// models/slideshow.model.js
const mongoose = require('mongoose');

const SlideshowSchema = new mongoose.Schema({
  slideNumber: { type: String, required: true, unique: true },
  slideImage: { type: String, required: true },
  slideHeader: String,
  slideDetail: String,
  slideLink: String,
});

module.exports = mongoose.model('Slideshow', SlideshowSchema);
