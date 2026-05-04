const mongoose = require("mongoose");

const compatibilitySchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      min: 1950,
      max: 2100
    },
    make: {
      type: String,
      required: true,
      trim: true
    },
    make_slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    model_slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  },
  { _id: false }
);

const vendorListingSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null
    },

    product_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductRequest",
      default: null
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    condition: { type: String, enum: ["new", "used"], required: true },
    price: { type: Number, required: true },
    quantity_available: { type: Number, required: true, min: 0 },
    location: { type: String, default: "" },

    oem_part_number: {
      type: String,
      trim: true,
      default: ""
    },

    compatibility: {
      type: [compatibilitySchema],
      default: []
    },

    status: {
      type: String,
      enum: ["pending_product_approval", "inactive", "active"],
      default: "active"
    },

    image_url: String,
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

vendorListingSchema.index({ vendor_id: 1, createdAt: -1 });
vendorListingSchema.index({ product_id: 1 });
vendorListingSchema.index({ product_request_id: 1 });
vendorListingSchema.index({ status: 1 });
vendorListingSchema.index({ oem_part_number: 1 });
vendorListingSchema.index({ "compatibility.make_slug": 1 });
vendorListingSchema.index({ "compatibility.model_slug": 1 });
vendorListingSchema.index({ "compatibility.year": 1 });

module.exports = mongoose.model("VendorListing", vendorListingSchema);