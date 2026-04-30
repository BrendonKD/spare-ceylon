const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true
    },
    last_message: { type: String, default: "" },
    last_message_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

conversationSchema.index({ customer_id: 1, vendor_id: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);