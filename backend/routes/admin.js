const express = require("express");
const router = express.Router();

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