const mongoose = require("mongoose");

const adminInquirySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    subject: {
      type: String,
      trim: true,
      default: ""
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    adminReply: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "replied"],
      default: "pending"
    },
    repliedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminInquiry", adminInquirySchema);