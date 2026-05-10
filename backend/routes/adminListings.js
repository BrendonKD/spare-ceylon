const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/authMiddleware");
const VendorListing = require("../models/VendorListing");
const Product = require("../models/Product");

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

router.use(auth, isAdmin);

// GET /api/admin/listings?product_id=...
router.get("/", async (req, res) => {
  try {
    const { product_id, search = "", status = "" } = req.query;

    const filter = {};

    if (product_id) {
      if (!mongoose.Types.ObjectId.isValid(product_id)) {
        return res.status(400).json({ message: "Invalid product id" });
      }
      filter.product_id = product_id;
    }

    if (status && ["active", "inactive", "pending_product_approval"].includes(status)) {
      filter.status = status;
    }

    if (search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { location: { $regex: search.trim(), $options: "i" } },
        { oem_part_number: { $regex: search.trim(), $options: "i" } }
      ];
    }

    const listings = await VendorListing.find(filter)
      .populate("vendor_id", "full_name email business_name")
      .populate("product_id", "name description")
      .populate("product_request_id", "name status")
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/listings/product/:productId/meta
router.get("/product/:productId/meta", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;