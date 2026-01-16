const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const CustomerVehicle = require("../models/CustomerVehicle");
//const Order = require("../models/Order");

// GET /api/garage  -> list vehicles for logged-in customer
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can access garage" });
    }

    const vehicles = await CustomerVehicle.find({ customer_id: req.user._id }).sort({
      createdAt: -1
    });

    res.json(vehicles);
  } catch (err) {
    console.error("Garage list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/garage  -> add vehicle
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can add vehicles" });
    }

    const { make, model, year, vehicle_no, fuel_type, engine_capacity, mileage, image_url } =
      req.body;

    const vehicle = new CustomerVehicle({
      customer_id: req.user._id,
      make,
      model,
      year,
      vehicle_no,
      fuel_type,
      engine_capacity,
      mileage,
      image_url
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    console.error("Garage add error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/garage/:id  -> delete one vehicle
router.delete("/:id", auth, async (req, res) => {
  try {
    const vehicle = await CustomerVehicle.findOneAndDelete({
      _id: req.params.id,
      customer_id: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ message: "Vehicle deleted" });
  } catch (err) {
    console.error("Garage delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/garage/:id/history  -> list orders for that vehicle (stub)
router.get("/:id/history", auth, async (req, res) => {
  try {
    // placeholder - link to ORDERS by vehicle_no or customer_vehicle_id
    // const orders = await Order.find({ customer_id: req.user._id, vehicle_id: req.params.id });
    const orders = []; // for now
    res.json(orders);
  } catch (err) {
    console.error("Garage history error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
