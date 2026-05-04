const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 120
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });
productSchema.index({ is_active: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);