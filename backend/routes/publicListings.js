const express = require("express");
const router = express.Router();
const VendorListing = require("../models/VendorListing");
const Vendor = require("../models/Vendor");

const normalizePath = (p) => (p ? p.replace(/\\/g, "/") : null);

// Lookups
const lookupVendor = {
  $lookup: {
    from: "vendors",
    localField: "vendor_id",
    foreignField: "vendor_id",
    as: "vendorInfo"
  }
};

const lookupProduct = {
  $lookup: {
    from: "products",
    localField: "product_id",
    foreignField: "_id",
    as: "productInfo"
  }
};

const lookupReviews = {
  $lookup: {
    from: "reviews",
    localField: "_id",
    foreignField: "listing_id",
    as: "reviews"
  }
};

const lookupSoldStats = {
  $lookup: {
    from: "orders",
    let: { listingId: "$_id" },
    pipeline: [
      {
        $match: {
          $expr: { $eq: ["$vendor_listing_id", "$$listingId"] },
          status: { $in: ["confirmed", "shipped", "delivered"] }
        }
      },
      {
        $group: {
          _id: "$vendor_listing_id",
          items_sold: { $sum: "$quantity" },
          orders_count: { $sum: 1 }
        }
      }
    ],
    as: "soldStats"
  }
};

const unwindVendor = {
  $unwind: {
    path: "$vendorInfo",
    preserveNullAndEmptyArrays: true
  }
};

const unwindProduct = {
  $unwind: {
    path: "$productInfo",
    preserveNullAndEmptyArrays: true
  }
};

// ---------------------------------------------------------------------------
// Derived fields
// ---------------------------------------------------------------------------
const addReviewStats = {
  $addFields: {
    review_count: { $size: "$reviews" },
    average_rating: {
      $round: [
        {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $avg: "$reviews.rating" },
            0
          ]
        },
        1
      ]
    }
  }
};

const addSoldStats = {
  $addFields: {
    items_sold: {
      $ifNull: [{ $arrayElemAt: ["$soldStats.items_sold", 0] }, 0]
    },
    orders_count: {
      $ifNull: [{ $arrayElemAt: ["$soldStats.orders_count", 0] }, 0]
    }
  }
};

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------
const projectStage = {
  $project: {
    items_sold: 1,
    orders_count: 1,
    title: 1,
    price: 1,
    condition: 1,
    image_url: 1,
    description: 1,
    location: 1,
    status: 1,
    quantity_available: 1,
    views: 1,
    createdAt: 1,
    average_rating: 1,
    review_count: 1,
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
      brand: "$productInfo.brand",
      oem_part_number: "$productInfo.oem_part_number",
      compatibility: "$productInfo.compatibility"
    }
  }
};

// ---------------------------------------------------------------------------
// Pipelines
// ---------------------------------------------------------------------------
const buildSearchPipeline = (baseMatch, searchTerm, limit) => [
  { $match: baseMatch },
  lookupProduct,
  unwindProduct,
  {
    $match: {
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { "productInfo.name": { $regex: searchTerm, $options: "i" } },
        { "productInfo.oem_part_number": { $regex: searchTerm, $options: "i" } }
      ]
    }
  },
  { $sort: { createdAt: -1 } },
  { $limit: limit },
  lookupVendor,
  unwindVendor,
  lookupReviews,
  addReviewStats,
  lookupSoldStats,
  addSoldStats,
  projectStage
];

const buildBrowsePipeline = (baseMatch, sortStage, limit) => [
  { $match: baseMatch },
  { $sort: sortStage },
  { $limit: limit },
  lookupVendor,
  unwindVendor,
  lookupProduct,
  unwindProduct,
  lookupReviews,
  addReviewStats,
  lookupSoldStats,
  addSoldStats,
  projectStage
];

// GET /latest
router.get("/latest", async (req, res) => {
  try {
    const { search } = req.query;
    const baseMatch = { status: "active", quantity_available: { $gt: 0 } };

    const pipeline = search?.trim()
      ? buildSearchPipeline(baseMatch, search.trim(), 12)
      : buildBrowsePipeline(baseMatch, { createdAt: -1 }, 12);

    const listings = await VendorListing.aggregate(pipeline);

    res.json(
      listings.map((l) => ({
        ...l,
        image_url: normalizePath(l.image_url)
      }))
    );
  } catch (err) {
    console.error("Latest listings error:", err);
    res.status(500).json({ message: err.message });
  }
});


// GET /trending
router.get("/trending", async (req, res) => {
  try {
    const baseMatch = { status: "active", quantity_available: { $gt: 0 } };

    const listings = await VendorListing.aggregate(
      buildBrowsePipeline(baseMatch, { views: -1, createdAt: -1 }, 8)
    );

    res.json(
      listings.map((l) => ({
        ...l,
        image_url: normalizePath(l.image_url)
      }))
    );
  } catch (err) {
    console.error("Trending listings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// GET /vendors/verified
router.get("/vendors/verified", async (req, res) => {
  try {
    const vendors = await Vendor.find({ verification_status: "verified" })
      .populate("vendor_id", "full_name email")
      .limit(6)
      .select("business_name logo_url vendor_id verification_status address description")
      .lean();

    res.json(vendors.map((v) => ({ ...v, logo_url: normalizePath(v.logo_url) })));
  } catch (err) {
    console.error("Verified vendors error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/public/listings
router.get("/listings", async (req, res) => {
  try {
    const PAGE_SIZE = 30;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const baseMatch = {
      status: "active",
      quantity_available: { $gt: 0 }
    };

    if (req.query.q) {
      const q = req.query.q.trim();
      baseMatch.$or = [
        { title: { $regex: q, $options: "i" } },
        { searchKeywords: { $regex: q, $options: "i" } }
      ];
    }

    if (req.query.condition) {
      const cond = req.query.condition.split(",").filter(Boolean);
      if (cond.length) baseMatch.condition = { $in: cond };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      baseMatch.price = {};
      if (req.query.minPrice) baseMatch.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) baseMatch.price.$lte = Number(req.query.maxPrice);
    }

    if (req.query.location) {
      const locs = req.query.location.split(",").filter(Boolean);
      if (locs.length) baseMatch.location = { $in: locs };
    }

    const skip = (page - 1) * PAGE_SIZE;

    const pipeline = [
      { $match: baseMatch },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: PAGE_SIZE },
      lookupVendor,
      unwindVendor,
      lookupProduct,
      unwindProduct,
      lookupReviews,
      addReviewStats,
      lookupSoldStats,
      addSoldStats,
      projectStage
    ];

    const [items, total] = await Promise.all([
      VendorListing.aggregate(pipeline),
      VendorListing.countDocuments(baseMatch)
    ]);

    const normalizedItems = items.map((l) => ({
      ...l,
      image_url: normalizePath(l.image_url)
    }));

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

    res.json({
      items: normalizedItems,
      total,
      page,
      totalPages
    });
  } catch (err) {
    console.error("Fetch parts list error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /:id
router.get("/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    const oid = new mongoose.Types.ObjectId(id);

    await VendorListing.findByIdAndUpdate(id, { $inc: { views: 1 } });

    const [listing] = await VendorListing.aggregate([
      { $match: { _id: oid } },
      lookupVendor,
      unwindVendor,
      lookupProduct,
      unwindProduct,
      lookupReviews,
      addReviewStats,
      lookupSoldStats,
      addSoldStats,
      projectStage
    ]);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.image_url = normalizePath(listing.image_url);

    const moreFromVendor = await VendorListing.aggregate(
      buildBrowsePipeline(
        { vendor_id: listing.vendor.userId, status: "active", _id: { $ne: oid } },
        { createdAt: -1 },
        4
      )
    );

    res.json({
      listing,
      moreFromVendor: moreFromVendor.map((l) => ({
        ...l,
        image_url: normalizePath(l.image_url)
      }))
    });
  } catch (err) {
    console.error("Listing detail error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;