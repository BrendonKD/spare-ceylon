const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true
    },
    listing_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorListing",
      required: true,
      index: true
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);