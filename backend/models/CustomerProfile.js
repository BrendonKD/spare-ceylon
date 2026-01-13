const mongoose = require("mongoose");

const customerProfileSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    default_location: { type: String, required: true },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerProfile", customerProfileSchema);
