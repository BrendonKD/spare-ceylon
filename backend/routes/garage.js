const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const CustomerVehicle = require("../models/CustomerVehicle");
const multer = require("multer");
const path = require("path");

// Configure image upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// GET /api/garage -> list vehicles for logged-in customer
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can access garage" });
    }

    const vehicles = await CustomerVehicle.find({ customer_id: req.user._id }).sort({
      is_primary: -1,
      createdAt: -1
    });

    res.json(vehicles);
  } catch (err) {
    console.error("Garage list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/garage -> add vehicle
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can add vehicles" });
    }

    const { make, model, year, vehicle_no, fuel_type, engine_capacity, mileage } = req.body;

    if (!make || !model || !year || !vehicle_no || !fuel_type || !engine_capacity || !mileage) {
      return res.status(400).json({ message: "All vehicle fields are required" });
    }

    const existingVehicleNo = await CustomerVehicle.findOne({
      customer_id: req.user._id,
      vehicle_no: vehicle_no.trim()
    });

    if (existingVehicleNo) {
      return res.status(400).json({ message: "This vehicle number already exists in your garage" });
    }

    const existingCount = await CustomerVehicle.countDocuments({ customer_id: req.user._id });

    const vehicle = new CustomerVehicle({
      customer_id: req.user._id,
      make: make.trim(),
      model: model.trim(),
      year,
      vehicle_no: vehicle_no.trim(),
      fuel_type: fuel_type.trim(),
      engine_capacity: engine_capacity.trim(),
      mileage: mileage.trim(),
      image_url: req.file ? req.file.path.replace(/\\/g, "/") : "",
      is_primary: existingCount === 0
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    console.error("Garage add error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/garage/:id/primary -> set primary vehicle
router.patch("/:id/primary", auth, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can update garage" });
    }

    const vehicle = await CustomerVehicle.findOne({
      _id: req.params.id,
      customer_id: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    await CustomerVehicle.updateMany(
      { customer_id: req.user._id },
      { $set: { is_primary: false } }
    );

    vehicle.is_primary = true;
    await vehicle.save();

    const vehicles = await CustomerVehicle.find({ customer_id: req.user._id }).sort({
      is_primary: -1,
      createdAt: -1
    });

    res.json({
      message: "Primary vehicle updated",
      vehicles
    });
  } catch (err) {
    console.error("Set primary vehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/garage/:id/service-records -> add service record
router.post("/:id/service-records", auth, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can update garage" });
    }

    const { service_type, notes, service_date, mileage_at_service } = req.body;

    if (!service_type || !service_date) {
      return res.status(400).json({ message: "Service type and service date are required" });
    }

    const vehicle = await CustomerVehicle.findOne({
      _id: req.params.id,
      customer_id: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    vehicle.service_records.unshift({
      service_type: service_type.trim(),
      notes: notes?.trim() || "",
      service_date,
      mileage_at_service: mileage_at_service?.trim() || ""
    });

    await vehicle.save();

    res.status(201).json({
      message: "Service record added successfully",
      vehicle
    });
  } catch (err) {
    console.error("Add service record error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/garage/:id/history -> list service records
router.get("/:id/history", auth, async (req, res) => {
  try {
    const vehicle = await CustomerVehicle.findOne({
      _id: req.params.id,
      customer_id: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const records = [...(vehicle.service_records || [])].sort(
      (a, b) => new Date(b.service_date) - new Date(a.service_date)
    );

    res.json(records);
  } catch (err) {
    console.error("Garage history error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/garage/:id -> delete one vehicle
router.delete("/:id", auth, async (req, res) => {
  try {
    const vehicle = await CustomerVehicle.findOneAndDelete({
      _id: req.params.id,
      customer_id: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // If primary vehicle deleted, promote another one automatically
    if (vehicle.is_primary) {
      const nextVehicle = await CustomerVehicle.findOne({
        customer_id: req.user._id
      }).sort({ createdAt: -1 });

      if (nextVehicle) {
        nextVehicle.is_primary = true;
        await nextVehicle.save();
      }
    }

    res.json({ message: "Vehicle deleted" });
  } catch (err) {
    console.error("Garage delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;