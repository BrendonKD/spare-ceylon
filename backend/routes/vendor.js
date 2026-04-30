const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const protect = require("../middleware/authMiddleware");

const uploadDir = path.join(__dirname, "../uploads/vendor-docs");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "application/pdf",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, PNG, WEBP, and PDF files are allowed."), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadFields = upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "nic_front", maxCount: 1 },
    { name: "nic_back", maxCount: 1 },
    { name: "br_certificate", maxCount: 1 },
    { name: "registration_certificate", maxCount: 1 },
]);

router.get("/me", protect, async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ vendor_id: req.user._id });

        if (!vendor) {
            return res.status(404).json({ message: "Vendor profile not found." });
        }

        res.status(200).json({ vendor });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch vendor profile.",
            error: error.message,
        });
    }
});

router.put("/me", protect, uploadFields, async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ vendor_id: req.user._id });

        if (!vendor) {
            return res.status(404).json({ message: "Vendor profile not found." });
        }

        const {
            business_name,
            business_reg_no,
            address,
            description,
            verification_badge_shown,
            latitude,
            longitude,
        } = req.body;

        if (business_name !== undefined) vendor.business_name = business_name;
        if (business_reg_no !== undefined) vendor.business_reg_no = business_reg_no;
        if (address !== undefined) vendor.address = address;
        if (description !== undefined) vendor.description = description;

        if (verification_badge_shown !== undefined) {
            vendor.verification_badge_shown =
                verification_badge_shown === "true" || verification_badge_shown === true;
        }

        if (latitude !== undefined && latitude !== "") vendor.latitude = Number(latitude);
        if (longitude !== undefined && longitude !== "") vendor.longitude = Number(longitude);

        if (req.files?.logo?.[0]) {
            vendor.logo_url = `/uploads/vendor-docs/${req.files.logo[0].filename}`;
        }

        if (req.files?.nic_front?.[0]) {
            vendor.nic_front_url = `/uploads/vendor-docs/${req.files.nic_front[0].filename}`;
        }

        if (req.files?.nic_back?.[0]) {
            vendor.nic_back_url = `/uploads/vendor-docs/${req.files.nic_back[0].filename}`;
        }

        if (req.files?.br_certificate?.[0]) {
            vendor.br_certificate_url = `/uploads/vendor-docs/${req.files.br_certificate[0].filename}`;
        }

        if (req.files?.registration_certificate?.[0]) {
            vendor.registration_certificate_url =
                `/uploads/vendor-docs/${req.files.registration_certificate[0].filename}`;
        }

        await vendor.save();

        res.status(200).json({
            message: "Vendor profile updated successfully.",
            vendor,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update vendor profile.",
            error: error.message,
        });
    }
});

router.delete("/me", protect, async (req, res) => {
    try {
        const vendor = await Vendor.findOneAndDelete({ vendor_id: req.user._id });

        if (!vendor) {
            return res.status(404).json({ message: "Vendor profile not found." });
        }

        res.status(200).json({
            message: "Vendor account deleted permanently.",
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete vendor account.",
            error: error.message,
        });
    }
});

module.exports = router;