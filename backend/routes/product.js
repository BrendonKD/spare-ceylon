const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const VendorListing = require("../models/VendorListing"); // to get sum of total listings
const auth = require("../middleware/authMiddleware");

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

// GET /api/products?q=&limit=
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);

    const filter = { is_active: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }

    const products = await Product.find(filter)
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    const productIds = products.map((p) => p._id);

    const listingCounts = await VendorListing.aggregate([
      {
        $match: {
          product_id: { $in: productIds }
        }
      },
      {
        $group: {
          _id: "$product_id",
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    listingCounts.forEach((item) => {
      countMap[String(item._id)] = item.count;
    });

    const productsWithCounts = products.map((product) => ({
      ...product,
      listingCount: countMap[String(product._id)] || 0
    }));

    res.json(productsWithCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products
router.post("/", auth, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const existing = await Product.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" }
    });

    if (existing) {
      return res.status(400).json({ message: "Product already exists" });
    }

    const product = new Product({
      name: name.trim(),
      description: description?.trim() || ""
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/products/:id
router.put("/:id", auth, isAdmin, async (req, res) => {
  try {
    const { name, description, is_active } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Product name is required" });
      }

      const duplicate = await Product.findOne({
        _id: { $ne: product._id },
        name: { $regex: `^${name.trim()}$`, $options: "i" }
      });

      if (duplicate) {
        return res.status(400).json({ message: "Another product with this name already exists" });
      }

      product.name = name.trim();
    }

    if (description !== undefined) {
      product.description = description.trim();
    }

    if (typeof is_active === "boolean") {
      product.is_active = is_active;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;