const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    business_name: { type: String, required: true },
    business_reg_no: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String },
    logo_url: { type: String, default: null },
    verification_status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },
    verification_badge_shown: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);