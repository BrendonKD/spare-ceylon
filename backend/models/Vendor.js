const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    business_name: {
      type: String,
      required: true,
      trim: true,
    },

    business_reg_no: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    logo_url: {
      type: String,
      default: null,
    },

    verification_status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    verification_badge_shown: {
      type: Boolean,
      default: false,
    },

    nic_front_url: {
      type: String,
      default: null,
    },

    nic_back_url: {
      type: String,
      default: null,
    },

    br_certificate_url: {
      type: String,
      default: null,
    },

    registration_certificate_url: {
      type: String,
      default: null,
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    verification_document_url: {
      type: String,
      default: null,
    },

    verification_document_visible: {
      type: Boolean,
      default: false,
    },

    verification_document_status: {
      type: String,
      enum: ["active", "hidden", "revoked"],
      default: "hidden",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);