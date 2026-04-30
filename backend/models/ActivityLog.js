const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entity_type: {
      type: String,
      required: true,
      enum: ["vendor", "advertisement", "listing", "user", "system"],
    },
    entity_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    performed_by_role: {
      type: String,
      enum: ["admin", "vendor", "customer", "system"],
      default: "system",
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entity_type: 1, entity_id: 1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);