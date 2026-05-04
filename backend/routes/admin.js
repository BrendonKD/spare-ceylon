const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const VendorListing = require("../models/VendorListing");
const Advertisement = require("../models/Advertisement");
const ActivityLog = require("../models/ActivityLog");

const adminOnly = (req, res, next) =>
  req.user && req.user.role === "admin"
    ? next()
    : res.status(403).json({ message: "Admins only" });

router.use(auth, adminOnly);

//create admin from admin
router.post("/create-admin", async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newAdmin = new User({
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: "admin",
      password_hash,
      status: "active",
    });

    await newAdmin.save();

    res.status(201).json({
      message: "New admin created successfully.",
      admin: {
        _id: newAdmin._id,
        full_name: newAdmin.full_name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
      },
    });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalVendors,
      pendingVendors,
      activeListings,
      pendingAds,
      totalAds,
    ] = await Promise.all([
      User.countDocuments(),
      Vendor.countDocuments(),
      Vendor.countDocuments({ verification_status: "pending" }),
      VendorListing.countDocuments({ status: "active" }),
      Advertisement.countDocuments({ status: "pending" }),
      Advertisement.countDocuments(),
    ]);

    res.json({
      totalUsers,
      totalVendors,
      pendingVendors,
      activeListings,
      pendingAds,
      totalAds,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/vendors/pending
router.get("/vendors/pending", async (req, res) => {
  try {
    const vendors = await Vendor.find({ verification_status: "pending" })
      .populate("vendor_id", "full_name email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json(vendors);
  } catch (err) {
    console.error("Pending vendors error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "_id full_name email phone role status createdAt"
    ).sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("Fetch admin users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/activity
router.get("/activity", async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate("performed_by", "full_name email role")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json(logs);
  } catch (err) {
    console.error("Admin activity error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;