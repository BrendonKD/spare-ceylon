const express = require("express");
const router = express.Router();
const User = require("../models/User");
const CustomerProfile = require("../models/CustomerProfile");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/authMiddleware");
const Vendor = require("../models/Vendor");


// POST user register details
router.post("/register", async (req, res) => {
  try {
    const { role, firstName, lastName, email, phone, location, password } = req.body;

    if (role !== "customer") {
      return res.status(400).json({ message: "Only customer registration here" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({
      full_name: `${firstName} ${lastName}`,
      email,
      phone,
      role: "customer"
    });
    await user.setPassword(password);
    await user.save();

    const profile = new CustomerProfile({
      customer_id: user._id,
      default_location: location
    });
    await profile.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "Customer registered", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("Login body:", req.body);

    const { email, password, role } = req.body;

    const user = await User.findOne({ email, role });
    console.log("Found user:", user);           

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);            
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("full_name email role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      full_name: user.full_name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// POST vendor registration
router.get("/register/vendor", async (req, res) => {
  try {
    const {
      contactFirstName,
      contactLastName,
      email,
      phone,
      businessName,
      businessRegNo,
      address,
      description,
      password
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    //create user with role 'vendor'
    const user = new User({
      full_name: `${contactFirstName} ${contactLastName}`,
      email,
      phone,
      role: "vendor"
    });
    await user.setPassword(password);
    await user.save();

    //create vendor profile
    const vendor = new Vendor({
      vendor_id: user._id,
      business_name: businessName,
      business_reg_no: businessRegNo,
      address,
      description
    });
    await vendor.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Vendor registered",
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Vendor register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
