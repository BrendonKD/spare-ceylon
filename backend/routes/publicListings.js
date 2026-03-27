const express = require("express");
const router = express.Router();
const VendorListing = require("../models/VendorListing");
const Vendor = require("../models/Vendor");

const normalizePath = (p) => (p ? p.replace(/\\/g, "/") : null);

// ── $project stage ────────────────────────────────────────────────────────
// CHANGED: added description + location (needed for listing detail page)
const projectStage = {
  $project: {
    title: 1,
    price: 1,
    condition: 1,
    image_url: 1,
    description: 1,   // ← NEW
    location: 1,      // ← NEW
    status: 1,
    quantity_available: 1,
    views: 1,
    createdAt: 1,
    vendor: {
      _id: "$vendorInfo._id",
      userId: "$vendorInfo.vendor_id",
      business_name: "$vendorInfo.business_name",
      logo_url: "$vendorInfo.logo_url",
      verification_status: "$vendorInfo.verification_status",
      address: "$vendorInfo.address"
    },
    product: {
      _id: "$productInfo._id",
      name: "$productInfo.name",
      oem_part_number: "$productInfo.oem_part_number"
    }
  }
};

// ── $lookup stages ────────────────────────────────────────────────────────
const lookupVendor  = { $lookup: { from: "vendors",  localField: "vendor_id",  foreignField: "vendor_id", as: "vendorInfo" } };
const lookupProduct = { $lookup: { from: "products", localField: "product_id", foreignField: "_id",       as: "productInfo" } };
const unwindVendor  = { $unwind: { path: "$vendorInfo",  preserveNullAndEmptyArrays: true } };
const unwindProduct = { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } };

// ── Pipeline A — SEARCH ───────────────────────────────────────────────────
// Products joined BEFORE $match so productInfo fields are searchable
const buildSearchPipeline = (baseMatch, searchTerm, limit) => [
  { $match: baseMatch },
  lookupProduct, unwindProduct,
  { $match: { $or: [
    { title:                         { $regex: searchTerm, $options: "i" } },
    { "productInfo.name":            { $regex: searchTerm, $options: "i" } },
    { "productInfo.oem_part_number": { $regex: searchTerm, $options: "i" } }
  ]}},
  { $sort: { createdAt: -1 } }, { $limit: limit },
  lookupVendor, unwindVendor,
  projectStage
];

// ── Pipeline B — BROWSE / TRENDING ───────────────────────────────────────
const buildBrowsePipeline = (baseMatch, sortStage, limit) => [
  { $match: baseMatch },
  { $sort: sortStage }, { $limit: limit },
  lookupVendor, unwindVendor,
  lookupProduct, unwindProduct,
  projectStage
];

// ── GET /latest   supports ?search=query ─────────────────────────────────
router.get("/latest", async (req, res) => {
  try {
    const { search } = req.query;
    const baseMatch = { status: "active", quantity_available: { $gt: 0 } };

    const pipeline = search?.trim()
      ? buildSearchPipeline(baseMatch, search.trim(), 12)
      : buildBrowsePipeline(baseMatch, { createdAt: -1 }, 12);

    const listings = await VendorListing.aggregate(pipeline);
    console.log(`✅ Latest listings returned: ${listings.length}`);
    res.json(listings.map((l) => ({ ...l, image_url: normalizePath(l.image_url) })));
  } catch (err) {
    console.error("❌ Latest listings error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /trending ─────────────────────────────────────────────────────────
router.get("/trending", async (req, res) => {
  try {
    const baseMatch = { status: "active", quantity_available: { $gt: 0 } };
    const listings = await VendorListing.aggregate(
      buildBrowsePipeline(baseMatch, { views: -1, createdAt: -1 }, 8)
    );
    console.log("✅ Trending listings:", listings.map((l) => ({ title: l.title, views: l.views })));
    res.json(listings.map((l) => ({ ...l, image_url: normalizePath(l.image_url) })));
  } catch (err) {
    console.error("❌ Trending listings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /vendors/verified ─────────────────────────────────────────────────
// IMPORTANT: This MUST stay above GET /:id — otherwise "verified" matches as an id
router.get("/vendors/verified", async (req, res) => {
  try {
    const vendors = await Vendor.find({ verification_status: "verified" })
      .populate("vendor_id", "full_name email")
      .limit(6)
      .select("business_name logo_url vendor_id verification_status address description")
      .lean();
    console.log("✅ Verified vendors:", vendors.length);
    res.json(vendors.map((v) => ({ ...v, logo_url: normalizePath(v.logo_url) })));
  } catch (err) {
    console.error("❌ Verified vendors error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /:id   Single listing detail + "more from vendor" ─────────────────
// NEW: increments views (powers trending), returns full listing data
router.get("/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    const oid = new mongoose.Types.ObjectId(id);

    // Increment views atomically — this is what makes trending work
    await VendorListing.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Full listing with vendor + product
    const [listing] = await VendorListing.aggregate([
      { $match: { _id: oid } },
      lookupVendor, unwindVendor,
      lookupProduct, unwindProduct,
      projectStage
    ]);

    if (!listing) return res.status(404).json({ message: "Listing not found" });
    listing.image_url = normalizePath(listing.image_url);

    // Up to 4 more listings from the same vendor (exclude current)
    const moreFromVendor = await VendorListing.aggregate(
      buildBrowsePipeline(
        { vendor_id: listing.vendor.userId, status: "active", _id: { $ne: oid } },
        { createdAt: -1 },
        4
      )
    );

    res.json({
      listing,
      moreFromVendor: moreFromVendor.map((l) => ({ ...l, image_url: normalizePath(l.image_url) }))
    });
  } catch (err) {
    console.error("❌ Listing detail error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;