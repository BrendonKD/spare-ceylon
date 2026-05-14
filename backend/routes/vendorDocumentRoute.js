const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const auth = require("../middleware/authMiddleware");
const Vendor = require("../models/Vendor");

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
};


//show the certificate to the vendor in settings page
router.get("/me/verification-document", auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor only." });
    }

    const userId = req.user._id || req.user.id;
    const vendor = await Vendor.findOne({ vendor_id: userId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found." });
    }

    if (
      vendor.verification_status !== "verified" ||
      !vendor.verification_document_visible ||
      vendor.verification_document_status !== "active" ||
      !vendor.verification_document_url
    ) {
      return res.status(403).json({
        message: "Verification certificate is not available.",
      });
    }

    const cleanRelativePath = vendor.verification_document_url.replace(/^\/+/, "");
    const filePath = path.join(__dirname, "..", cleanRelativePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Certificate file not found." });
    }

    res.setHeader("Content-Type", "application/pdf");
    return res.sendFile(filePath);
  } catch (error) {
    console.error("Vendor certificate access error:", error);
    return res.status(500).json({ message: "Failed to access certificate." });
  }
});


//this is for hide the document by public accessible by others from url
router.get("/:vendorId/verification-document", auth, adminOnly, async (req, res) => {
    try {
        const { vendorId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({ message: "Invalid vendor ID." });
        }

        const vendor = await Vendor.findById(vendorId);

        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found." });
        }

        if (
            vendor.verification_status !== "verified" ||
            !vendor.verification_document_visible ||
            vendor.verification_document_status !== "active" ||
            !vendor.verification_document_url
        ) {
            return res.status(403).json({
                message: "Verification document is hidden or revoked.",
            });
        }

        const filePath = path.join(__dirname, "..", vendor.verification_document_url);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Document file not found." });
        }

        return res.sendFile(filePath);
    } catch (error) {
        console.error("Document access error:", error);
        return res.status(500).json({ message: "Failed to access verification document." });
    }
});

module.exports = router;