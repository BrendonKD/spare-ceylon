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