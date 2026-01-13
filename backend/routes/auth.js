const express = require("express");
const router = express.Router();
const User = require("../models/User");
const CustomerProfile = require("../models/CustomerProfile");
const jwt = require("jsonwebtoken");

// POST /api/auth/register
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
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password and role are required" });
    }

    // 1) find user by email + role
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2) compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3) generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    // 4) send JSON response
    res.json({
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
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
