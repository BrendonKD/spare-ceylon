const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Vendor = require("../models/Vendor");
const protect = require("../middleware/authMiddleware");

const uploadDir = path.join(__dirname, "../uploads/messages");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

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

router.post(
  "/conversations/:conversationId",
  protect,
  (req, res, next) => {
    upload.single("image")(req, res, function (err) {
      if (err) {
        console.error("multer error:", err);
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const text = req.body?.text || "";
      const userId = req.user.id;
      const userRole = req.user.role;

      const trimmedText = text.trim();
      const imageUrl = req.file ? `/uploads/messages/${req.file.filename}` : null;

      if (!trimmedText && !imageUrl) {
        return res.status(400).json({ message: "Message text or image is required" });
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

        if (!vendorProfile) {
          return res.status(404).json({ message: "Vendor profile not found" });
        }

        isAuthorized = conversation.vendor_id.toString() === vendorProfile._id.toString();
      }

      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const message = await Message.create({
        conversation_id: conversationId,
        sender_id: userId,
        sender_role: userRole,
        text: trimmedText,
        image_url: imageUrl,
        read_by: [userId]
      });

      conversation.last_message = trimmedText || "Image";
      conversation.last_message_at = new Date();
      await conversation.save();

      res.status(201).json(message);
    } catch (error) {
      console.error("send message error:", error);
      res.status(500).json({ message: error.message || "Failed to send message" });
    }
  }
);

module.exports = router;