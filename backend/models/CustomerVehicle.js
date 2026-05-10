const mongoose = require("mongoose");

const serviceRecordSchema = new mongoose.Schema(
  {
    service_type: {
      type: String,
      required: true,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    service_date: {
      type: Date,
      required: true
    },
    mileage_at_service: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

const customerVehicleSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    vehicle_no: { type: String, required: true, trim: true },
    fuel_type: { type: String, required: true, trim: true },
    engine_capacity: { type: String, required: true, trim: true },
    mileage: { type: String, required: true, trim: true },
    image_url: { type: String, default: "" },

    // Helps highlight one main vehicle in the garage
    is_primary: {
      type: Boolean,
      default: false
    },

    // Simple embedded service history for each vehicle
    service_records: [serviceRecordSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerVehicle", customerVehicleSchema);