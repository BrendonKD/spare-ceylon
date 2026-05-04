const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const AdminInquiry = require("../models/AdminInquiry");
const User = require("../models/User");

const adminOnly = (req, res, next) =>
  req.user && req.user.role === "admin"
    ? next()
    : res.status(403).json({ message: "Admins only" });

const customerOnly = (req, res, next) =>
  req.user && req.user.role === "customer"
    ? next()
    : res.status(403).json({ message: "Customers only" });

// Customer creates inquiry
router.post("/", auth, customerOnly, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    const inquiry = await AdminInquiry.create({
      customerId: req.user._id,
      subject: subject?.trim() || "",
      message: message.trim()
    });

    res.status(201).json(inquiry);
  } catch (err) {
    console.error("Create inquiry error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Customer gets own inquiries
router.get("/my", auth, customerOnly, async (req, res) => {
  try {
    const inquiries = await AdminInquiry.find({ customerId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (err) {
    console.error("Get my inquiries error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin gets all inquiries
router.get("/admin", auth, adminOnly, async (req, res) => {
  try {
    const inquiries = await AdminInquiry.find()
      .populate("customerId", "full_name email")
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (err) {
    console.error("Get admin inquiries error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin replies to inquiry
router.put("/admin/:id/reply", auth, adminOnly, async (req, res) => {
  try {
    const { adminReply } = req.body;

    if (!adminReply || !adminReply.trim()) {
      return res.status(400).json({ message: "Reply message is required." });
    }

    const inquiry = await AdminInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    inquiry.adminReply = adminReply.trim();
    inquiry.status = "replied";
    inquiry.repliedAt = new Date();

    await inquiry.save();

    const updated = await AdminInquiry.findById(inquiry._id).populate(
      "customerId",
      "full_name email"
    );

    res.json(updated);
  } catch (err) {
    console.error("Reply inquiry error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;