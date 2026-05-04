const mongoose = require("mongoose");

const productRequestSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    admin_note: {
      type: String,
      default: "",
      trim: true
    },
    approved_product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewed_at: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

productRequestSchema.index({ vendor_id: 1, createdAt: -1 });
productRequestSchema.index({ status: 1, createdAt: -1 });
productRequestSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("ProductRequest", productRequestSchema);