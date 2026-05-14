const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const VendorListing = require("../models/VendorListing");
const Product = require("../models/Product");
const ProductRequest = require("../models/ProductRequest");
const VendorSubscription = require("../models/VendorSubscription"); //validate subscription limit on listings

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/listings/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

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

const upload = multer({ storage });

router.use(auth);

// GET vendor's listings
router.get("/", async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const listings = await VendorListing.find({ vendor_id: req.user._id })
      .populate("product_id", "name oem_part_number compatibility")
      .populate("product_request_id", "name status oem_part_number")
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new listing
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const activeSubscription = await VendorSubscription.findOne({
      vendor_id: req.user._id,
      status: "active"
    }).populate("plan_id");

    if (!activeSubscription || !activeSubscription.plan_id) {
      return res.status(403).json({
        message: "No active subscription plan found."
      });
    }

    const plan = activeSubscription.plan_id;

    const currentListingCount = await VendorListing.countDocuments({
      vendor_id: req.user._id,
      status: { $in: ["active", "inactive", "pending_product_approval"] }
    });

    if (
      typeof plan.listing_limit === "number" &&
      plan.listing_limit > 0 &&
      currentListingCount >= plan.listing_limit
    ) {
      return res.status(403).json({
        message: `Your ${plan.name} plan allows only ${plan.listing_limit} listings.`
      });
    }

    const {
      product_id,
      product_request_id,
      title,
      description,
      condition,
      price,
      quantity_available,
      location,
      oem_part_number,
      compatibility
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!condition || !["new", "used"].includes(condition)) {
      return res.status(400).json({ message: "Condition is invalid" });
    }

    if (!price || Number(price) <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    if (quantity_available === undefined || Number(quantity_available) < 0) {
      return res.status(400).json({ message: "Quantity must be 0 or more" });
    }

    let finalProductId = null;
    let finalProductRequestId = null;
    let finalStatus = "active";
    let fallbackCompatibility = [];
    let fallbackOem = "";

    if (product_id) {
      const product = await Product.findById(product_id);
      if (!product) {
        return res.status(400).json({
          message: "Selected product does not exist in master catalog"
        });
      }
      finalProductId = product._id;
      finalStatus = "active";
      fallbackCompatibility = product.compatibility || [];
      fallbackOem = product.oem_part_number || "";
    } else if (product_request_id) {
      const request = await ProductRequest.findById(product_request_id);
      if (!request) {
        return res.status(400).json({ message: "Selected product request does not exist" });
      }

      if (String(request.vendor_id) !== String(req.user._id)) {
        return res.status(403).json({ message: "You can only use your own product requests" });
      }

      fallbackCompatibility = request.compatibility || [];
      fallbackOem = request.oem_part_number || "";

      if (request.status === "approved" && request.approved_product_id) {
        finalProductId = request.approved_product_id;
        finalStatus = "active";
      } else {
        finalProductRequestId = request._id;
        finalStatus = "pending_product_approval";
      }
    } else {
      return res.status(400).json({
        message: "Please select a master product or attach an approved/pending product request"
      });
    }

    let parsedCompatibility = [];
    if (compatibility) {
      try {
        parsedCompatibility = normalizeCompatibility(JSON.parse(compatibility));
      } catch {
        return res.status(400).json({ message: "Compatibility data is invalid" });
      }
    }

    const finalCompatibility =
      parsedCompatibility.length > 0 ? parsedCompatibility : fallbackCompatibility;

    const finalOem = (oem_part_number || "").trim() || fallbackOem;

    const filename = req.file ? req.file.filename : null;

    const listing = new VendorListing({
      vendor_id: req.user._id,
      product_id: finalProductId,
      product_request_id: finalProductRequestId,
      title: title.trim(),
      description: description || "",
      condition,
      price: Number(price),
      quantity_available: Number(quantity_available),
      location: location || "",
      oem_part_number: finalOem,
      compatibility: finalCompatibility,
      status: finalStatus,
      image_url: filename ? `uploads/listings/${filename}` : null
    });

    await listing.save();

    const populated = await VendorListing.findById(listing._id)
      .populate("product_id", "name oem_part_number compatibility")
      .populate("product_request_id", "name status oem_part_number compatibility");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE listing
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const listing = await VendorListing.findOne({
      _id: req.params.id,
      vendor_id: req.user._id
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const {
      product_id,
      title,
      description,
      condition,
      price,
      quantity_available,
      location,
      oem_part_number,
      compatibility
    } = req.body;

    if (product_id) {
      const product = await Product.findById(product_id);
      if (!product) {
        return res.status(400).json({
          message: "Selected product does not exist in master catalog"
        });
      }

      listing.product_id = product._id;
      listing.product_request_id = null;

      if (listing.status === "pending_product_approval") {
        listing.status = "active";
      }

      if (!compatibility || compatibility === "[]") {
        listing.compatibility = product.compatibility || [];
      }

      if (!oem_part_number?.trim()) {
        listing.oem_part_number = product.oem_part_number || "";
      }
    }

    if (title !== undefined) listing.title = title.trim();
    if (description !== undefined) listing.description = description;
    if (condition !== undefined) listing.condition = condition;
    if (price !== undefined) listing.price = Number(price);
    if (quantity_available !== undefined) listing.quantity_available = Number(quantity_available);
    if (location !== undefined) listing.location = location;
    if (oem_part_number !== undefined) listing.oem_part_number = oem_part_number.trim();

    if (compatibility !== undefined) {
      try {
        listing.compatibility = normalizeCompatibility(JSON.parse(compatibility));
      } catch {
        return res.status(400).json({ message: "Compatibility data is invalid" });
      }
    }

    if (req.file) {
      listing.image_url = `uploads/listings/${req.file.filename}`;
    }

    await listing.save();

    const populated = await VendorListing.findById(listing._id)
      .populate("product_id", "name oem_part_number compatibility")
      .populate("product_request_id", "name status oem_part_number compatibility");

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE listing
router.delete("/:id", async (req, res) => {
  try {
    const listing = await VendorListing.findOneAndDelete({
      _id: req.params.id,
      vendor_id: req.user._id
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ACTIVATE listing after product request approval
// ACTIVATE listing
router.put("/:id/activate", async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const listing = await VendorListing.findOne({
      _id: req.params.id,
      vendor_id: req.user._id
    })
      .populate("product_id", "name oem_part_number compatibility")
      .populate("product_request_id", "name status oem_part_number compatibility approved_product_id");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.status !== "inactive") {
      return res.status(400).json({
        message: "Only inactive listings can be activated"
      });
    }

    // If this listing came from a product request,
    // it must be approved before activation
    if (listing.product_request_id) {
      if (listing.product_request_id.status !== "approved") {
        return res.status(400).json({
          message: "This listing cannot be activated until the product request is approved"
        });
      }

      // If approved but product_id is still not linked, attach approved product
      if (!listing.product_id && listing.product_request_id.approved_product_id) {
        listing.product_id = listing.product_request_id.approved_product_id;
      }

      if (!listing.product_id) {
        return res.status(400).json({
          message: "Approved product is not linked yet. Please contact admin."
        });
      }
    }

    listing.status = "active";
    await listing.save();

    const populated = await VendorListing.findById(listing._id)
      .populate("product_id", "name oem_part_number compatibility")
      .populate("product_request_id", "name status oem_part_number compatibility");

    res.json({
      message: "Listing activated successfully",
      listing: populated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DEACTIVATE listing
router.put("/:id/deactivate", async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const listing = await VendorListing.findOne({
      _id: req.params.id,
      vendor_id: req.user._id
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.status !== "active") {
      return res.status(400).json({ message: "Only active listings can be deactivated" });
    }

    listing.status = "inactive";
    await listing.save();

    const populated = await VendorListing.findById(listing._id)
      .populate("product_id", "name oem_part_number compatibility")
      .populate("product_request_id", "name status oem_part_number");

    res.json({
      message: "Listing deactivated successfully",
      listing: populated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//vendor can view number of listings added per day in metrics
router.get("/activity/weekly", async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const result = await VendorListing.aggregate([
      {
        $match: {
          vendor_id: req.user._id,
          createdAt: { $gte: start, $lte: today }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });

      const found = result.find((item) => item._id === key);

      days.push({
        date: key,
        label,
        count: found ? found.count : 0
      });
    }

    res.json(days);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;