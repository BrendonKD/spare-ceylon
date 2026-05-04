const express = require("express");
const router = express.Router();
const User = require("../models/User");
const CustomerProfile = require("../models/CustomerProfile");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/authMiddleware");
const Vendor = require("../models/Vendor");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sendForgotPasswordOtpMail = require("../utils/forgotPasswordMail");
const SubscriptionPlan = require("../models/SubscriptionPlan"); //for subscription base vendor
const VendorSubscription = require("../models/VendorSubscription");

const uploadDir = path.join(__dirname, "../uploads/profile-images");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user._id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."), false);
  }
};

const uploadProfileImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

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

// POST forgot password - send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ message: "Email and phone are required." });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
    });

    if (!user) {
      return res.status(404).json({ message: "No user found with provided email and phone." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.reset_otp = await bcrypt.hash(otp, 10);
    user.reset_otp_expires = new Date(Date.now() + 10 * 60 * 1000);
    user.reset_otp_verified = false;

    await user.save();

    try {
      await sendForgotPasswordOtpMail({
        to: user.email,
        name: user.full_name,
        otp,
      });
    } catch (mailErr) {
      user.reset_otp = null;
      user.reset_otp_expires = null;
      user.reset_otp_verified = false;
      await user.save();

      throw mailErr;
    }

    return res.status(200).json({
      message: "OTP sent to your email successfully.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// POST verify reset OTP
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !user.reset_otp || !user.reset_otp_expires) {
      return res.status(400).json({ message: "No OTP request found." });
    }

    if (user.reset_otp_expires < new Date()) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    const isMatch = await bcrypt.compare(otp, user.reset_otp);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    user.reset_otp_verified = true;
    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully.",
    });
  } catch (err) {
    console.error("Verify reset OTP error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// POST reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.reset_otp_verified) {
      return res.status(400).json({ message: "OTP is not verified." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);

    user.reset_otp = null;
    user.reset_otp_expires = null;
    user.reset_otp_verified = false;

    await user.save();

    return res.status(200).json({
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

//retrive the user data
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "full_name email phone address profile_image role"
    );

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
      phone: user.phone,
      address: user.address || "",
      profile_image: user.profile_image || "",
      role: user.role,
      business_name,
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

//update profile details
router.put("/profile", auth, uploadProfileImage.single("profile_image"), async (req, res) => {
  try {
    const { full_name, phone, address } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (full_name !== undefined) {
      if (!full_name.trim()) {
        return res.status(400).json({ message: "Full name is required." });
      }
      user.full_name = full_name.trim();
    }

    if (phone !== undefined) {
      if (!phone.trim()) {
        return res.status(400).json({ message: "Phone is required." });
      }
      user.phone = phone.trim();
    }

    if (address !== undefined) {
      user.address = address.trim();
    }

    if (req.file) {
      user.profile_image = `/uploads/profile-images/${req.file.filename}`;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address || "",
        profile_image: user.profile_image || "",
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
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
      password,
    } = req.body;

    if (
      !contactFirstName ||
      !contactLastName ||
      !email ||
      !phone ||
      !businessName ||
      !password
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({
      full_name: `${contactFirstName} ${contactLastName}`.trim(),
      email,
      phone,
      role: "vendor",
    });

    await user.setPassword(password);
    await user.save();

    const vendorData = {
      vendor_id: user._id,
      business_name: businessName,
    };

    if (businessRegNo && businessRegNo.trim() !== "") {
      vendorData.business_reg_no = businessRegNo.trim();
    }

    if (address && address.trim() !== "") {
      vendorData.address = address.trim();
    }

    if (description && description.trim() !== "") {
      vendorData.description = description.trim();
    }

    const vendor = new Vendor(vendorData);
    await vendor.save();

    const basicPlan = await SubscriptionPlan.findOne({
      slug: "basic",
      status: "active",
    });

    if (!basicPlan) {
      return res.status(500).json({
        message: "Basic subscription plan is not configured.",
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await VendorSubscription.updateMany(
      { vendor_id: user._id, status: "active" },
      { $set: { status: "cancelled" } }
    );

    await VendorSubscription.create({
      vendor_id: user._id,
      plan_id: basicPlan._id,
      billing_cycle: "monthly",
      price_paid: 0,
      currency: basicPlan.currency || "LKR",
      status: "active",
      start_date: startDate,
      end_date: endDate,
      activated_by_admin: false,
      payment_status: "paid",
      notes: "Default Basic plan assigned on vendor registration",
    });

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
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Vendor register error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    return res.status(500).json({
      message: err.message || "Server error",
    });
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
