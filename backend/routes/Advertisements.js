const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Advertisement = require("../models/Advertisement");
const auth = require("../middleware/authMiddleware");

// Multer — ad background images

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/ads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

const normalizePath = (p) => (p ? p.replace(/\\/g, "/") : null);

// GET /api/ads/active  — PUBLIC
// Returns currently active ads (within start/end date window).
// Automatically marks expired ones so stale data never shows.
router.get("/active", async (req, res) => {
  try {
    const now = new Date();

    // Expire any ads whose end_date has passed
    await Advertisement.updateMany(
      { status: "active", end_date: { $lt: now } },
      { $set: { status: "expired" } }
    );

    // Fetch active ads — one per slot (most recently started will display)
    const ads = await Advertisement.find({
      status: "active",
      start_date: { $lte: now },
      end_date:   { $gte: now }
    })
      .populate("vendor_id", "full_name")
      .sort({ start_date: -1 })
      .lean();

    // Build slot map: { left: adOrNull, right: adOrNull }
    const slots = { left: null, right: null };
    for (const ad of ads) {
      if (!slots[ad.slot]) {
        slots[ad.slot] = {
          ...ad,
          image_url: normalizePath(ad.image_url)
        };
      }
    }

    res.json(slots);
  } catch (err) {
    console.error("❌ Active ads error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ads  — VENDOR: submit new ad request
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendors only" });
    }

    const { slot, title, description, cta_label, duration_days, payment_note } =
      req.body;

    // Validate slot
    if (!["left", "right"].includes(slot)) {
      return res.status(400).json({ message: "slot must be 'left' or 'right'" });
    }

    const ad = new Advertisement({
      vendor_id:    req.user._id,
      slot,
      title,
      description,
      cta_label:    cta_label || "Shop Now",
      duration_days: Number(duration_days),
      payment_note: payment_note || "",
      image_url:    req.file
        ? normalizePath(`/uploads/ads/${req.file.filename}`)
        : null
    });

    await ad.save();
    res.status(201).json({ message: "Ad request submitted", ad });
  } catch (err) {
    console.error("❌ Ad submit error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ads/my  — VENDOR can see their own ad requests
router.get("/my", auth, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendors only" });
    }

    const ads = await Advertisement.find({ vendor_id: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(ads.map((a) => ({ ...a, image_url: normalizePath(a.image_url) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ads  — ADMIN: see all ad requests
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const { status } = req.query;
    const filter = status ? { status } : {};

    const ads = await Advertisement.find(filter)
      .populate("vendor_id", "full_name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(ads.map((a) => ({ ...a, image_url: normalizePath(a.image_url) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/ads/:id/approve  — ADMIN: approve and set live dates
// Body: { start_date? }  — defaults to now if not provided
router.patch("/:id/approve", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    const start = req.body.start_date ? new Date(req.body.start_date) : new Date();
    const end   = new Date(start);
    end.setDate(end.getDate() + ad.duration_days);

    ad.status     = "active";
    ad.start_date = start;
    ad.end_date   = end;
    ad.admin_note = "";
    await ad.save();

    res.json({
      message: `Ad approved. Runs from ${start.toDateString()} to ${end.toDateString()}`,
      ad
    });
  } catch (err) {
    console.error("❌ Approve error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/ads/:id/reject  — ADMIN: reject with optional note
// Body: { admin_note? }
router.patch("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    ad.status     = "rejected";
    ad.admin_note = req.body.admin_note || "";
    await ad.save();

    res.json({ message: "Ad rejected", ad });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;