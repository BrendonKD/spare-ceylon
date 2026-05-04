const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

const discussionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    replies: [replySchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

discussionSchema.virtual("replyCount").get(function () {
  return this.replies.length;
});

discussionSchema.set("toJSON", { virtuals: true });
discussionSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Discussion", discussionSchema);