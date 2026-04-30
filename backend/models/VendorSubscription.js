const mongoose = require('mongoose');

const vendorSubscriptionSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    price_paid: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'active',
    },
    start_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    end_date: {
      type: Date,
      required: true,
    },
    activated_by_admin: {
      type: Boolean,
      default: false,
    },
    stripe_session_id: {
      type: String,
      default: null,
    },
    stripe_payment_intent_id: {
      type: String,
      default: null,
    },
    payment_status: {
      type: String,
      enum: ['unpaid', 'paid', 'failed'],
      default: 'unpaid',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VendorSubscription', vendorSubscriptionSchema);