const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
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
    image_url: {
      type: String,
      default: null
    },
    cta_label: {
      type: String,
      default: "Shop Now",
      maxlength: 30
    },
    duration_days: {
      type: Number,
      required: true,
      min: 1,
      max: 90
    },

    payment_amount: {
      type: Number,
      required: true
    },
    payment_currency: {
      type: String,
      default: "lkr"
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending"
    },
    stripe_session_id: {
      type: String,
      default: null
    },
    stripe_payment_intent_id: {
      type: String,
      default: null
    },

    stripe_refund_id: {
      type: String,
      default: null,
    },
    refund_amount: {
      type: Number,
      default: 0,
    },
    refunded_at: {
      type: Date,
      default: null,
    },

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
    admin_note: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Advertisement", advertisementSchema);