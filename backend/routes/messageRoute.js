const express = require("express");
const router = express.Router();

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Vendor = require("../models/Vendor");
const protect = require("../middleware/authMiddleware");

// START or GET existing conversation with vendor
router.post("/conversations/start", protect, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { vendorId } = req.body;

    if (!vendorId) {
      return res.status(400).json({ message: "vendorId is required" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    let conversation = await Conversation.findOne({
      customer_id: customerId,
      vendor_id: vendorId
    })
      .populate("vendor_id", "business_name logo_url address verification_status")
      .populate("customer_id", "full_name email");

    if (!conversation) {
      conversation = await Conversation.create({
        customer_id: customerId,
        vendor_id: vendorId
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("vendor_id", "business_name logo_url address verification_status")
        .populate("customer_id", "full_name email");
    }

    res.json(conversation);
  } catch (error) {
    console.error("start conversation error:", error);
    res.status(500).json({ message: "Failed to start conversation" });
  }
});

// GET all conversations for logged-in user
router.get("/conversations", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let conversations = [];

    if (userRole === "customer") {
      conversations = await Conversation.find({ customer_id: userId })
        .populate("vendor_id", "business_name logo_url address verification_status")
        .populate("customer_id", "full_name email")
        .sort({ last_message_at: -1 });
    } else if (userRole === "vendor") {
      const vendorProfile = await Vendor.findOne({ vendor_id: userId });

      if (!vendorProfile) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }

      conversations = await Conversation.find({ vendor_id: vendorProfile._id })
        .populate("vendor_id", "business_name logo_url address verification_status")
        .populate("customer_id", "full_name email")
        .sort({ last_message_at: -1 });
    } else {
      return res.status(403).json({ message: "Invalid user role" });
    }

    res.json(conversations);
  } catch (error) {
    console.error("get conversations error:", error);
    res.status(500).json({ message: "Failed to load conversations" });
  }
});

// GET one conversation's messages
router.get("/conversations/:conversationId", protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    let isAuthorized = false;

    if (userRole === "customer") {
      isAuthorized = conversation.customer_id.toString() === userId;
    } else if (userRole === "vendor") {
      const vendorProfile = await Vendor.findOne({ vendor_id: userId });
      if (vendorProfile) {
        isAuthorized = conversation.vendor_id.toString() === vendorProfile._id.toString();
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const messages = await Message.find({ conversation_id: conversationId }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("get conversation messages error:", error);
    res.status(500).json({ message: "Failed to load messages" });
  }
});

// SEND message to conversation
router.post("/conversations/:conversationId", protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    let isAuthorized = false;

    if (userRole === "customer") {
      isAuthorized = conversation.customer_id.toString() === userId;
    } else if (userRole === "vendor") {
      const vendorProfile = await Vendor.findOne({ vendor_id: userId });
      if (vendorProfile) {
        isAuthorized = conversation.vendor_id.toString() === vendorProfile._id.toString();
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: userId,
      sender_role: userRole,
      text: text.trim(),
      read_by: [userId]
    });

    conversation.last_message = text.trim();
    conversation.last_message_at = new Date();
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    console.error("send message error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;