const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const VendorListing = require("../models/VendorListing");

router.use(auth);

router.get("/dashboard/summary", async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const vendorId = req.user._id;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const [statsResult, weeklyRaw, recentListings] = await Promise.all([
      VendorListing.aggregate([
        { $match: { vendor_id: vendorId } },
        {
          $facet: {
            total: [{ $count: "count" }],
            active: [{ $match: { status: "active" } }, { $count: "count" }],
            inactive: [{ $match: { status: "inactive" } }, { $count: "count" }],
            pending: [{ $match: { status: "pending_product_approval" } }, { $count: "count" }],
            lowStock: [{ $match: { quantity_available: { $lte: 5 } } }, { $count: "count" }],
            stockUnits: [
              {
                $group: {
                  _id: null,
                  total: { $sum: "$quantity_available" }
                }
              }
            ]
          }
        }
      ]),

      VendorListing.aggregate([
        {
          $match: {
            vendor_id: vendorId,
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
        { $sort: { _id: 1 } }
      ]),

      VendorListing.find({ vendor_id: vendorId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("title status createdAt updatedAt")
    ]);

    const stats = statsResult[0];

    const getCount = (arr) => (arr[0] ? arr[0].count : 0);
    const getTotal = (arr) => (arr[0] ? arr[0].total : 0);

    const weeklyActivity = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });

      const found = weeklyRaw.find((item) => item._id === key);

      weeklyActivity.push({
        date: key,
        label,
        count: found ? found.count : 0
      });
    }

    const recentActivity = recentListings.map((listing) => {
      const created = new Date(listing.createdAt).getTime();
      const updated = new Date(listing.updatedAt).getTime();
      const isNew = Math.abs(updated - created) < 5000;

      let text = "";
      let icon = "inventory_2";
      let color = "#0f766e";

      if (isNew) {
        text = `New listing created — ${listing.title}`;
        icon = "add_box";
        color = "#0f766e";
      } else if (listing.status === "inactive") {
        text = `Listing deactivated — ${listing.title}`;
        icon = "pause_circle";
        color = "#b45309";
      } else if (listing.status === "active") {
        text = `Listing updated — ${listing.title}`;
        icon = "task_alt";
        color = "#1d4ed8";
      } else if (listing.status === "pending_product_approval") {
        text = `Listing pending approval — ${listing.title}`;
        icon = "hourglass_top";
        color = "#7c3aed";
      }

      return {
        icon,
        color,
        text,
        time: listing.updatedAt
      };
    });

    res.json({
      stats: {
        total: getCount(stats.total),
        active: getCount(stats.active),
        inactive: getCount(stats.inactive),
        pending: getCount(stats.pending),
        lowStock: getCount(stats.lowStock),
        stockUnits: getTotal(stats.stockUnits)
      },
      weeklyActivity,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;