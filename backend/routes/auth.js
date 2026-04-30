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

    let business_name = null;

    if (user.role === "vendor") {
      const vendorProfile = await Vendor.findOne({ vendor_id: user._id }).select("business_name");
      if (vendorProfile) {
        business_name = vendorProfile.business_name;
      }
    }

    return res.json({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      business_name
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// POST vendor registration
router.post("/register/vendor", async (req, res) => {
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

// UPDATE logged-in user's email / password
router.put("/account", auth, async (req, res) => {
  try {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });

      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Email is already in use." });
      }

      user.email = email;
    }

    const wantsPasswordChange =
      currentPassword || newPassword || confirmPassword;

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          message: "Current password, new password and confirm password are required.",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    return res.status(200).json({
      message: "Account updated successfully.",
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Account update error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET all users details - admin only
router.get("/users", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const users = await User.find()
      .select("_id full_name email phone role status createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json(users);
  } catch (err) {
    console.error("Get all users error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PATCH user status - admin only
router.patch("/users/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.status = status;
    await user.save();

    return res.status(200).json({
      message: "User status updated successfully.",
      user: {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update user status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE user - admin only
router.delete("/users/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await User.findByIdAndDelete(req.params.id);

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
