const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Review = require("../models/Review");
const Order = require("../models/Order");
const requireAuth = require("../middleware/authMiddleware");

// Create review for delivered order
router.post("/", requireAuth, async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(order_id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const order = await Order.findOne({
      _id: order_id,
      customer_id: req.user._id
    }).populate("vendor_listing_id");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Review allowed only after delivery" });
    }

    const existing = await Review.findOne({ order_id });
    if (existing) {
      return res.status(400).json({ message: "Review already submitted for this order" });
    }

    const listing = order.vendor_listing_id;
    if (!listing) {
      return res.status(400).json({ message: "Listing not found for this order" });
    }

    const review = await Review.create({
      order_id,
      listing_id: listing._id,
      customer_id: req.user._id,
      vendor_id: listing.vendor_id,
      rating: ratingNum,
      comment: comment?.trim() || ""
    });

    res.status(201).json(review);
  } catch (err) {
    console.error("Create review error:", err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "Review already submitted for this order" });
    }

    res.status(500).json({ message: err.message });
  }
});

// Get customer's review by order id
router.get("/order/:orderId", requireAuth, async (req, res) => {
  try {
    const review = await Review.findOne({ order_id: req.params.orderId });
    res.json(review || null);
  } catch (err) {
    console.error("Fetch review by order error:", err);
    res.status(500).json({ message: err.message });
  }
});

// public reviews by listing
router.get("/listing/:listingId", async (req, res) => {
  try {
    const reviews = await Review.find({ listing_id: req.params.listingId })
      .sort({ createdAt: -1 })
      .limit(36)
      .populate("customer_id", "full_name");

    res.json(reviews);
  } catch (err) {
    console.error("Fetch listing reviews error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;