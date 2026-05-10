const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const Order = require("../models/Order");
const Message = require("../models/Message");
const CustomerVehicle = require("../models/CustomerVehicle");
const AdminInquiry = require("../models/AdminInquiry");
const Conversation = require("../models/Conversation");

router.get("/stats", auth, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can access dashboard stats" });
    }

    const userId = req.user._id;

    const customerConversations = await Conversation.find({
      customer_id: userId
    }).select("_id");

    const conversationIds = customerConversations.map((c) => c._id);

    const [totalOrders, myVehicles, myInquiries, unreadMessages] = await Promise.all([
      Order.countDocuments({ customer_id: userId }),
      CustomerVehicle.countDocuments({ customer_id: userId }),
      AdminInquiry.countDocuments({ customerId: userId }),
      Message.countDocuments({
        conversation_id: { $in: conversationIds },
        sender_role: "vendor",
        read_by: { $ne: userId }
      })
    ]);

    res.json({
      totalOrders,
      unreadMessages,
      myVehicles,
      myInquiries
    });
  } catch (err) {
    console.error("Customer dashboard stats error:", err);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
});

module.exports = router;