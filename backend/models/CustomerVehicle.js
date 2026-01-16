const mongoose = require("mongoose");

const customerVehicleSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    make: { type: String, required: true },          // Toyota
    model: { type: String, required: true },         // CHR
    year: { type: Number, required: true },          // 2024
    vehicle_no: { type: String, required: true },    // CBE-1010
    fuel_type: { type: String, required: true },     // Petrol / Diesel / Hybrid
    engine_capacity: { type: String, required: true }, // "1500cc"
    mileage: { type: String, required: true },       // "25000km"
    image_url: { type: String }                      // optional hero image
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerVehicle", customerVehicleSchema);
