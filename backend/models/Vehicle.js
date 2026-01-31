const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: String,
  model: String,
  year_start: Number,
  year_end: Number
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
