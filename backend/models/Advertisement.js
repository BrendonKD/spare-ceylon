const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // Which promo slot on the Home page: left card or right card
    slot: {
      type: String,
      enum: ["left", "right"],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 60
    },
    description: {
      type: String,
      required: true,
      maxlength: 120
    },
    // Background image uploaded by vendor
    image_url: {
      type: String,
      default: null
    },
    // CTA button label e.g. "Shop Now", "View Deals"
    cta_label: {
      type: String,
      default: "Shop Now",
      maxlength: 30
    },
    // How many days the vendor wants to run the ad
    duration_days: {
      type: Number,
      required: true,
      min: 1,
      max: 90
    },
    // Vendor's note about payment / bank transfer reference etc.
    payment_note: {
      type: String,
      maxlength: 200,
      default: ""
    },
    // Set by admin on approval
    start_date: {
      type: Date,
      default: null
    },
    end_date: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "expired"],
      default: "pending"
    },
    // Admin note shown to vendor on rejection
    admin_note: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Advertisement", advertisementSchema);