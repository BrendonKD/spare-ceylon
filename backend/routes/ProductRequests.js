const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const ProductRequest = require("../models/ProductRequest");
const Product = require("../models/Product");
const VendorListing = require("../models/VendorListing");
const {
  sendProductRequestApprovedEmail,
  sendProductRequestRejectedEmail
} = require("../utils/ProductApproveEmail");

const slugify = (value = "") => value.toString().trim().toLowerCase();

const normalizeCompatibility = (compatibility = []) => {
  if (!Array.isArray(compatibility)) return [];

  return compatibility
    .map((item) => ({
      year: Number(item.year),
      make: (item.make || "").trim(),
      make_slug: slugify(item.make),
      model: (item.model || "").trim(),
      model_slug: slugify(item.model)
    }))
    .filter(
      (item) =>
        item.year &&
        item.make &&
        item.make_slug &&
        item.model &&
        item.model_slug
    );
};

router.use(auth);

// Vendor submits request
router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendors only" });
    }

    const { name, description, oem_part_number, compatibility } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const request = await ProductRequest.create({
      vendor_id: req.user._id,
      name: name.trim(),
      description: description || "",
      oem_part_number: oem_part_number || "",
      compatibility: normalizeCompatibility(compatibility)
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Vendor sees own requests
router.get("/my", async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendors only" });
    }

    const requests = await ProductRequest.find({ vendor_id: req.user._id })
      .populate("approved_product_id", "name oem_part_number")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin gets requests
router.get("/", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const { status = "", q = "" } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (q.trim()) {
      query.$or = [
        { name: { $regex: q.trim(), $options: "i" } },
        { oem_part_number: { $regex: q.trim(), $options: "i" } },
        { "compatibility.make": { $regex: q.trim(), $options: "i" } },
        { "compatibility.model": { $regex: q.trim(), $options: "i" } }
      ];
    }

    const requests = await ProductRequest.find(query)
      .populate("vendor_id", "full_name email")
      .populate("approved_product_id", "name oem_part_number")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin approves request and auto-links pending listings
router.put("/:id/approve", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const request = await ProductRequest.findById(req.params.id).populate(
      "vendor_id",
      "full_name email"
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Only pending requests can be approved" });
    }

    const adminNotes = req.body.admin_notes || "";

    const product = await Product.create({
      name: request.name,
      description: request.description,
      oem_part_number: request.oem_part_number,
      compatibility: request.compatibility
    });

    request.status = "approved";
    request.approved_product_id = product._id;
    request.admin_notes = adminNotes;
    await request.save();

    await VendorListing.updateMany(
      {
        product_request_id: request._id,
        status: "pending_product_approval"
      },
      {
        $set: {
          product_id: product._id,
          status: "inactive"
        }
      }
    );

    try {
      if (request.vendor_id?.email) {
        await sendProductRequestApprovedEmail({
          to: request.vendor_id.email,
          vendorName: request.vendor_id.full_name,
          productName: request.name,
          adminNotes
        });
      }
    } catch (mailErr) {
      console.error("Approval email send failed:", mailErr);
    }

    const updated = await ProductRequest.findById(request._id)
      .populate("vendor_id", "full_name email")
      .populate("approved_product_id", "name oem_part_number");

    res.json({
      message: "Request approved, linked to pending listings, and vendor notified",
      request: updated,
      product
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin rejects request
router.put("/:id/reject", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const request = await ProductRequest.findById(req.params.id).populate(
      "vendor_id",
      "full_name email"
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Only pending requests can be rejected" });
    }

    const adminNotes = req.body.admin_notes || "";

    request.status = "rejected";
    request.admin_notes = adminNotes;
    await request.save();

    try {
      if (request.vendor_id?.email) {
        await sendProductRequestRejectedEmail({
          to: request.vendor_id.email,
          vendorName: request.vendor_id.full_name,
          productName: request.name,
          adminNotes
        });
      }
    } catch (mailErr) {
      console.error("Rejection email send failed:", mailErr);
    }

    const updated = await ProductRequest.findById(request._id)
      .populate("vendor_id", "full_name email")
      .populate("approved_product_id", "name oem_part_number");

    res.json({
      message: "Request rejected and vendor notified",
      request: updated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;