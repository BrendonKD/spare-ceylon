const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const VendorListing = require("../models/VendorListing");
const auth = require("../middleware/authMiddleware");

const normalizePath = (p) => (p ? p.replace(/\\/g, "/") : null);

// GET logged-in user's cart
router.get("/", auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ customer_id: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        customer_id: req.user.id,
        items: [],
      });
    }

    res.json(cart);
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ADD item to cart
router.post("/add", auth, async (req, res) => {
  try {
    const { listingId, qty = 1 } = req.body;

    const listing = await VendorListing.findById(listingId).populate(
      "product_id",
      "name"
    );

    if (!listing || listing.status !== "active") {
      return res.status(404).json({ message: "Listing not found" });
    }

    const Vendor = require("../models/Vendor");
    const vendor = await Vendor.findOne({ vendor_id: listing.vendor_id }).lean();

    if (!listing || listing.status !== "active") {
      return res.status(404).json({ message: "Listing not found" });
    }

    let cart = await Cart.findOne({ customer_id: req.user.id });

    if (!cart) {
      cart = new Cart({
        customer_id: req.user.id,
        items: [],
      });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.vendor_listing_id.toString() === listingId
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].qty += Number(qty) || 1;
    } else {
      cart.items.push({
        vendor_listing_id: listing._id,
        qty: Number(qty) || 1,
        title: listing.title || listing.product_id?.name || "",
        image_url: normalizePath(listing.image_url),
        condition: listing.condition || "",
        price_at_added: listing.price || 0,
        vendor_id: listing.vendor_id || null,
        vendor_name: vendor?.business_name || "Unknown Vendor",
      });
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error("Add cart item error:", err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE qty
router.patch("/item/:listingId", auth, async (req, res) => {
  try {
    const { listingId } = req.params;
    const qty = Math.max(1, Number(req.body.qty) || 1);

    const cart = await Cart.findOne({ customer_id: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (i) => i.vendor_listing_id.toString() === listingId
    );

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    item.qty = qty;
    await cart.save();

    res.json(cart);
  } catch (err) {
    console.error("Update cart qty error:", err);
    res.status(500).json({ message: err.message });
  }
});

// REMOVE item
router.delete("/item/:listingId", auth, async (req, res) => {
  try {
    const { listingId } = req.params;

    const cart = await Cart.findOne({ customer_id: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (i) => i.vendor_listing_id.toString() !== listingId
    );

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error("Remove cart item error:", err);
    res.status(500).json({ message: err.message });
  }
});

// CLEAR cart
router.delete("/clear", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer_id: req.user.id });

    if (!cart) {
      return res.json({ success: true, items: [] });
    }

    cart.items = [];
    await cart.save();

    res.json({ success: true, items: [] });
  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;