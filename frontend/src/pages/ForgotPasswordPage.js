import React, { useState } from "react";
import "./styles/ForgotPasswordPage.css";
import logoSC from "../assets/logoSC.png";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const apiCall = async (endpoint, body) => {
    setStatus({ loading: true, error: "", success: "" });

    try {
      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setStatus({ loading: false, error: "", success: data.message });
      return true;
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: "" });
      return false;
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    const success = await apiCall("forgot-password", {
      email: formData.email,
      phone: formData.phone,
    });

    if (success) setStep(2);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const success = await apiCall("verify-reset-otp", {
      email: formData.email,
      otp: formData.otp,
    });

    if (success) setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({
        loading: false,
        error: "Passwords do not match.",
        success: "",
      });
      return;
    }

    const success = await apiCall("reset-password", {
      email: formData.email,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });

    if (success) {
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-overlay" />

      <div className="forgot-card">
        <div className="forgot-brand">
          <img src={logoSC} alt="Spare Ceylon" className="forgot-logo" />
        </div>

        <div className="forgot-header">
          <h1>Reset your password</h1>
          <p>
            Secure your account in three quick steps and get back to your
            dashboard.
          </p>
        </div>

        <div className="forgot-steps">
          <div className={`step-chip ${step >= 1 ? "active" : ""}`}>1. Verify account</div>
          <div className={`step-chip ${step >= 2 ? "active" : ""}`}>2. Enter OTP</div>
          <div className={`step-chip ${step >= 3 ? "active" : ""}`}>3. New password</div>
        </div>

        {status.error && (
          <div className="forgot-alert forgot-alert-error">{status.error}</div>
        )}

        {status.success && (
          <div className="forgot-alert forgot-alert-success">{status.success}</div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="forgot-form">
            <div className="input-group">
              <label>Email Address</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <input
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <button type="submit" className="forgot-btn" disabled={status.loading}>
              {status.loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="forgot-form">
            <div className="info-box">
              OTP sent to <strong>{formData.email}</strong>
            </div>

            <div className="input-group">
              <label>Enter OTP</label>
              <input
                name="otp"
                type="text"
                value={formData.otp}
                onChange={handleChange}
                placeholder="6-digit OTP"
                required
              />
            </div>

            <button type="submit" className="forgot-btn" disabled={status.loading}>
              {status.loading ? "Verifying OTP..." : "Verify OTP"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-form">
            <div className="input-group">
              <label>New Password</label>
              <input
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="forgot-btn" disabled={status.loading}>
              {status.loading ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        )}

        <div className="forgot-footer">
          <button
            type="button"
            className="back-link"
            onClick={() => (window.location.href = "/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;