const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      enum: ['Basic', 'Pro', 'Premium'],
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      enum: ['basic', 'pro', 'premium'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price_monthly: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price_yearly: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'LKR',
      trim: true,
    },
    is_free: {
      type: Boolean,
      default: false,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    listing_limit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    has_featured_badge: {
      type: Boolean,
      default: false,
    },
    has_advanced_analytics: {
      type: Boolean,
      default: false,
    },
    has_priority_support: {
      type: Boolean,
      default: false,
    },
    has_homepage_promotion: {
      type: Boolean,
      default: false,
    },
    ad_credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    is_recommended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);