const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Advertisement = require("../models/Advertisement");
const PendingAdvertisementCheckout = require("../models/PendingAdvertisementCheckout");
const auth = require("../middleware/authMiddleware");
const logActivity = require("../utils/logActivity");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Multer — ad background images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/ads/"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.test(ext));
  },
});

const normalizePath = (p) => (p ? p.replace(/\\/g, "/") : null);

// GET /api/ads/active — PUBLIC
// Returns currently active ads and auto-expires outdated ones
router.get("/active", async (req, res) => {
  try {
    const now = new Date();

    await Advertisement.updateMany(
      { status: "active", end_date: { $lt: now } },
      { $set: { status: "expired" } }
    );

    const ads = await Advertisement.find({
      status: "active",
      start_date: { $lte: now },
      end_date: { $gte: now },
    })
      .populate("vendor_id", "full_name")
      .sort({ start_date: -1 })
      .lean();

    const slots = { left: null, right: null };

    for (const ad of ads) {
      if (!slots[ad.slot]) {
        slots[ad.slot] = {
          ...ad,
          image_url: normalizePath(ad.image_url),
        };
      }
    }

    res.json(slots);
  } catch (err) {
    console.error("Active ads error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ads — VENDOR: submit new ad request
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendors only" });
    }

    const { slot, title, description, cta_label, duration_days, payment_note } = req.body;

    if (!["left", "right"].includes(slot)) {
      return res.status(400).json({ message: "slot must be 'left' or 'right'" });
    }

    const ad = new Advertisement({
      vendor_id: req.user._id,
      slot,
      title,
      description,
      cta_label: cta_label || "Shop Now",
      duration_days: Number(duration_days),
      payment_note: payment_note || "",
      image_url: req.file ? normalizePath(`/uploads/ads/${req.file.filename}`) : null,
    });

    await ad.save();

    await logActivity({
      action: "advertisement_submitted",
      entity_type: "advertisement",
      entity_id: ad._id,
      message: `New advertisement request submitted: ${ad.title}.`,
      performed_by: req.user._id,
      performed_by_role: req.user.role,
      meta: {
        title: ad.title,
        slot: ad.slot,
        duration_days: ad.duration_days,
      },
    });

    res.status(201).json({ message: "Ad request submitted", ad });
  } catch (err) {
    console.error("Ad submit error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ads/my — VENDOR: own ad requests
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

// GET /api/ads — ADMIN: all ad requests, optional ?status=pending
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

// PATCH /api/ads/:id/approve — ADMIN
router.patch("/:id/approve", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    const start = req.body.start_date ? new Date(req.body.start_date) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + ad.duration_days);

    ad.status = "active";
    ad.start_date = start;
    ad.end_date = end;
    ad.admin_note = "";
    await ad.save();

    await logActivity({
      action: "advertisement_approved",
      entity_type: "advertisement",
      entity_id: ad._id,
      message: `Advertisement approved: ${ad.title}.`,
      performed_by: req.user._id,
      performed_by_role: req.user.role,
      meta: {
        title: ad.title,
        slot: ad.slot,
        start_date: ad.start_date,
        end_date: ad.end_date,
      },
    });

    res.json({
      message: `Ad approved. Runs from ${start.toDateString()} to ${end.toDateString()}`,
      ad,
    });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/ads/:id/reject — ADMIN
router.patch("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    ad.status = "rejected";
    ad.admin_note = req.body.admin_note || "";
    await ad.save();

    await logActivity({
      action: "advertisement_rejected",
      entity_type: "advertisement",
      entity_id: ad._id,
      message: `Advertisement rejected: ${ad.title}.`,
      performed_by: req.user._id,
      performed_by_role: req.user.role,
      meta: {
        title: ad.title,
        admin_note: ad.admin_note,
      },
    });

    res.json({ message: "Ad rejected", ad });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ads/admin/ads/stats — ADMIN: advertisement statistics
router.get("/admin/ads/stats", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const now = new Date();

    await Advertisement.updateMany(
      { status: "active", end_date: { $lt: now } },
      { $set: { status: "expired" } }
    );

    const stats = await Promise.all([
      Advertisement.countDocuments(),
      Advertisement.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $multiply: ["$duration_days", 500] },
            },
          },
        },
      ]),
      Advertisement.countDocuments({ status: "pending" }),
      Advertisement.countDocuments({ status: "active" }),
      Advertisement.countDocuments({ status: "rejected" }),
      Advertisement.countDocuments({ status: "expired" }),
    ]);

    res.json({
      totalAds: stats[0],
      totalRevenue: stats[1][0]?.totalRevenue || 0,
      pendingAds: stats[2],
      activeAds: stats[3],
      rejectedAds: stats[4],
      expiredAds: stats[5],
    });
  } catch (err) {
    console.error("Ads stats error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ads/admin/ads/stats/payments — ADMIN
router.get("/admin/ads/stats/payments", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const payments = await Advertisement.aggregate([
      { $match: { payment_status: "paid" } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: "$payment_amount" },
        },
      },
    ]);

    res.json({
      totalPayments: payments[0]?.totalPayments || 0,
    });
  } catch (err) {
    console.error("Payments stats error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ads/create-checkout-session — VENDOR
router.post("/create-checkout-session", auth, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendors only" });
    }

    const { slot, title, description, cta_label, duration_days } = req.body;

    if (!["left", "right"].includes(slot)) {
      return res.status(400).json({ message: "slot must be 'left' or 'right'" });
    }

    const duration = Number(duration_days);
    if (!duration || duration < 1 || duration > 90) {
      return res.status(400).json({ message: "Invalid duration_days" });
    }

    const PRICE_PER_DAY = 500;
    const amount = duration * PRICE_PER_DAY;

    const imagePath = req.file ? normalizePath(`/uploads/ads/${req.file.filename}`) : null;
    const checkoutRef = `ad_${req.user._id}_${Date.now()}`;

    await PendingAdvertisementCheckout.create({
      checkout_ref: checkoutRef,
      vendor_id: req.user._id,
      slot,
      title,
      description,
      cta_label: cta_label || "Shop Now",
      duration_days: duration,
      image_url: imagePath,
      payment_amount: amount,
      payment_currency: "lkr",
      status: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: `Homepage Advertisement (${slot} slot)`,
              description: `${title} - ${duration} day(s)`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/vendor/advertise?payment=success`,
      cancel_url: `http://localhost:3000/vendor/advertise?payment=cancelled`,
      metadata: {
        checkout_type: "advertisement_payment",
        checkout_ref: checkoutRef,
        vendor_id: req.user._id.toString(),
      },
      payment_intent_data: {
        metadata: {
          checkout_type: "advertisement_payment",
          checkout_ref: checkoutRef,
          vendor_id: req.user._id.toString(),
        },
      },
    });

    await PendingAdvertisementCheckout.findOneAndUpdate(
      { checkout_ref: checkoutRef },
      { stripe_session_id: session.id }
    );

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;