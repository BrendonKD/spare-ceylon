const mongoose = require('mongoose');

const pendingAdvertisementCheckoutSchema = new mongoose.Schema(
  {
    checkout_ref: {
      type: String,
      required: true,
      unique: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slot: {
      type: String,
      enum: ['left', 'right'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    cta_label: {
      type: String,
      default: 'Shop Now',
      trim: true,
    },
    duration_days: {
      type: Number,
      required: true,
      min: 1,
    },
    image_url: {
      type: String,
      default: null,
    },
    payment_amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    stripe_session_id: {
      type: String,
      default: null,
    },
    stripe_payment_intent_id: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 1000 * 60 * 60),
    },
  },
  { timestamps: true }
);

pendingAdvertisementCheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model( 'PendingAdvertisementCheckout', pendingAdvertisementCheckoutSchema);