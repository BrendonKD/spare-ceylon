const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const VendorListing = require("../models/VendorListing");

router.get("/vendors/all", async (req, res) => {
  try {
    const { q = "", verification = "" } = req.query;
    const filter = {};

    if (q.trim()) {
      filter.business_name = { $regex: q.trim(), $options: "i" };
    }

    if (verification === "verified") {
      filter.verification_status = "verified";
    } else if (verification === "not") {
      filter.verification_status = { $in: ["pending", "rejected"] };
    }

    const items = await Vendor.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      items,
      total: items.length
    });
  } catch (error) {
    console.error("Error fetching public vendors:", error);
    res.status(500).json({
      message: "Server error while fetching vendors.",
      error: error.message
    });
  }
});

router.get("/vendors/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const products = await VendorListing.find({
      vendor_id: vendor.vendor_id,
      status: "active"
    })
      .populate("product_id", "name oem_part_number")
      .sort({ createdAt: -1 });

    res.status(200).json({
      vendor,
      products
    });
  } catch (error) {
    console.error("Error fetching vendor details:", error);
    res.status(500).json({
      message: "Server error while fetching vendor details.",
      error: error.message
    });
  }
});

module.exports = router;