const mongoose = require('mongoose');

const pendingSubscriptionCheckoutSchema = new mongoose.Schema(
  {
    checkout_ref: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    billing_cycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    stripe_session_id: {
      type: String,
      default: null,
    },
    stripe_payment_intent_id: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 1000 * 60 * 60),
    },
  },
  { timestamps: true }
);

pendingSubscriptionCheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingSubscriptionCheckout', pendingSubscriptionCheckoutSchema);