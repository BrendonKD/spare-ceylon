const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    vendor_listing_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorListing",
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    title: {
      type: String,
      default: "",
    },
    image_url: {
      type: String,
      default: "",
    },
    condition: {
      type: String,
      default: "",
    },
    price_at_added: {
      type: Number,
      required: true,
      default: 0,
    },
    vendor_id: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    vendor_name: {
      type: String,
      default: "Unknown Vendor",
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);