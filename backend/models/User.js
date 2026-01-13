const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["customer", "vendor", "admin"], required: true },
    status: { type: String, default: "active" }
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(plain, salt);
};

module.exports = mongoose.model("User", userSchema);
