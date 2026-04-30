const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const auth = require("../middleware/authMiddleware");
const Vendor = require("../models/Vendor");
const User = require("../models/User");
const logActivity = require("../utils/logActivity");
const generateVendorVerificationDocument = require("../utils/generateVendorVerificationDocument");

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

// GET all vendors with filters + stats
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const { search = "", status = "all" } = req.query;

    const vendors = await Vendor.find()
      .populate("vendor_id", "full_name email phone status role createdAt")
      .sort({ createdAt: -1 });

    const q = search.trim().toLowerCase();

    const filteredVendors = vendors.filter((vendor) => {
      const matchesSearch =
        !q ||
        vendor.business_name?.toLowerCase().includes(q) ||
        vendor.business_reg_no?.toLowerCase().includes(q) ||
        vendor.address?.toLowerCase().includes(q) ||
        vendor.vendor_id?.full_name?.toLowerCase().includes(q) ||
        vendor.vendor_id?.email?.toLowerCase().includes(q);

      const matchesStatus =
        status === "all" || vendor.verification_status === status;

      return matchesSearch && matchesStatus;
    });

    const stats = {
      total: vendors.length,
      pending: vendors.filter((v) => v.verification_status === "pending").length,
      verified: vendors.filter((v) => v.verification_status === "verified").length,
      rejected: vendors.filter((v) => v.verification_status === "rejected").length,
    };

    return res.status(200).json({ vendors: filteredVendors, stats });
  } catch (error) {
    console.error("Get vendors error:", error);
    return res.status(500).json({ message: "Failed to fetch vendors." });
  }
});

// IMPORTANT: static routes must come before /:vendorId style routes
router.get("/pending/list", auth, adminOnly, async (req, res) => {
  try {
    const vendors = await Vendor.find({ verification_status: "pending" })
      .populate("vendor_id", "full_name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(vendors);
  } catch (error) {
    console.error("Get pending vendors error:", error);
    return res.status(500).json({ message: "Failed to fetch pending vendors." });
  }
});

router.get("/pending/list", auth, adminOnly, async (req, res) => {
  try {
    const vendors = await Vendor.find({ verification_status: "pending" })
      .populate("vendor_id", "full_name email phone")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json(vendors);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch pending vendors." });
  }
});

// GET one vendor detail
router.get("/:vendorId", auth, adminOnly, async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: "Invalid vendor ID." });
    }

    const vendor = await Vendor.findById(vendorId)
      .populate("vendor_id", "full_name email phone status role createdAt");

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    return res.status(200).json({ vendor });
  } catch (error) {
    console.error("Get vendor detail error:", error);
    return res.status(500).json({ message: "Failed to fetch vendor details." });
  }
});

// PUT verify / reject vendor
router.put("/:vendorId/verify", auth, adminOnly, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const {
      verification_status,
      verification_badge_shown,
      regenerate_certificate,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: "Invalid vendor ID." });
    }

    if (!["pending", "verified", "rejected"].includes(verification_status)) {
      return res.status(400).json({ message: "Invalid verification status." });
    }

    const vendor = await Vendor.findById(vendorId).populate(
      "vendor_id",
      "full_name email phone status role createdAt"
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    vendor.verification_status = verification_status;
    vendor.verification_badge_shown =
      typeof verification_badge_shown !== "undefined"
        ? verification_badge_shown === true || verification_badge_shown === "true"
        : verification_status === "verified";

    if (verification_status === "verified") {
      const shouldRegenerate =
        regenerate_certificate === true || regenerate_certificate === "true";

      if (!vendor.verification_document_url || shouldRegenerate) {
        const documentUrl = await generateVendorVerificationDocument(vendor);
        vendor.verification_document_url = documentUrl;
      }

      vendor.verification_document_visible = true;
      vendor.verification_document_status = "active";
    }

    if (verification_status === "rejected") {
      vendor.verification_badge_shown = false;
      vendor.verification_document_visible = false;
      vendor.verification_document_status = "revoked";
    }

    if (verification_status === "pending") {
      vendor.verification_badge_shown = false;
      vendor.verification_document_visible = false;
      vendor.verification_document_status = "hidden";
    }

    await vendor.save();

    await logActivity({
      action: `vendor_${verification_status}`,
      entity_type: "vendor",
      entity_id: vendor._id,
      message: `Vendor ${vendor.business_name} was marked as ${verification_status}.`,
      performed_by: req.user._id,
      performed_by_role: req.user.role,
      meta: {
        business_name: vendor.business_name,
        verification_status,
      },
    });

    return res.status(200).json({
      message: "Vendor verification updated successfully.",
      vendor,
    });
  } catch (error) {
    console.error("Verify vendor error:", error);
    return res.status(500).json({
      message: "Failed to update verification.",
      error: error.message,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }
});

// DELETE vendor and linked user
router.delete("/:vendorId", auth, adminOnly, async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: "Invalid vendor ID." });
    }

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    await logActivity({
      action: "vendor_deleted",
      entity_type: "vendor",
      entity_id: vendor._id,
      message: `Vendor ${vendor.business_name} was deleted by admin.`,
      performed_by: req.user._id,
      performed_by_role: req.user.role,
      meta: {
        business_name: vendor.business_name,
        vendor_user_id: vendor.vendor_id,
      },
    });

    await User.findByIdAndDelete(vendor.vendor_id);
    await Vendor.findByIdAndDelete(vendorId);

    return res.status(200).json({ message: "Vendor deleted successfully." });
  } catch (error) {
    console.error("Delete vendor error:", error);
    return res.status(500).json({ message: "Failed to delete vendor." });
  }
});

module.exports = router;