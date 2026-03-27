const express = require("express");
const router  = express.Router();
const Product = require("../models/Product");
const auth    = require("../middleware/authMiddleware");

// ── GET /api/products   — public, supports ?q= search ─────────────────────
router.get("/", async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const query = q ? {
      $or: [
        { name:            { $regex: q, $options: "i" } },
        { oem_part_number: { $regex: q, $options: "i" } }
      ]
    } : {};

    const products = await Product.find(query)
      .limit(Number(limit))
      .select("name oem_part_number description createdAt")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/products   — admin only ─────────────────────────────────────
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }
    const { name, description, oem_part_number } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }
    const product = await Product.create({ name, description, oem_part_number });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/products/:id   — admin only ──────────────────────────────────
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/products/:id   — admin only ───────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;