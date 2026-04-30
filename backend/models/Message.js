const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sender_role: {
      type: String,
      enum: ["customer", "vendor"],
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    read_by: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);