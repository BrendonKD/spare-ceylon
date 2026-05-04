import React, { useState } from "react";
import "./LoginPage.css";

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", selectedRole);

      if (selectedRole === "customer") {
        window.location.href = "/customer/dashboard";
      } else {
        window.location.href = "/vendor/dashboard";
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-layout-page container-fluid">
      <div className="row justify-content-center py-2">
        {/* LEFT: account type selection */}
        <div className="col-12 col-lg-5 mb-4 mb-lg-0">
          <div className="account-type-card">
            <div className="account-type-bg" />
            <div className="account-type-overlay">
              <h5 className="mb-4 text-center text-white">Choose Account Type</h5>

              <div className="row g-3">
                <div className="col-6">
                  <button
                    type="button"
                    className={`account-type-option ${selectedRole === "customer" ? "active" : ""
                      }`}
                    onClick={() => handleRoleClick("customer")}
                  >
                    {selectedRole === "customer" && (
                      <div className="tick-mark">✓</div>
                    )}
                    <div className="type-icon customer-icon" />
                    <div className="mt-2 fw-semibold">Customer</div>
                  </button>
                </div>

                <div className="col-6">
                  <button
                    type="button"
                    className={`account-type-option ${selectedRole === "vendor" ? "active" : ""
                      }`}
                    onClick={() => handleRoleClick("vendor")}
                  >
                    {selectedRole === "vendor" && (
                      <div className="tick-mark">✓</div>
                    )}
                    <div className="type-icon vendor-icon" />
                    <div className="mt-2 fw-semibold">Vendor</div>
                  </button>
                </div>
              </div>

              <div className="selected-indicator">
                {selectedRole === "customer"
                  ? "Customer login selected"
                  : "Vendor login selected"}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: sign-in form */}
        <div className="col-12 col-lg-5">
          <div className="auth-card auth-main-card">
            <div className="auth-card-header text-center mb-3">
              <h5 className="mb-1">Welcome Back!</h5>
              <p className="mb-0 text-muted small">
                Sign in to your account or create a new one
              </p>
            </div>

            <div className="auth-toggle mb-3">
              <button className="toggle-btn active" type="button">
                Sign In
              </button>
              <button
                className="toggle-btn"
                type="button"
                onClick={() =>
                (window.location.href =
                  selectedRole === "customer"
                    ? "/register/customer"
                    : "/register/vendor")
                }
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small">Email Address</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  className="form-control auth-input"
                  placeholder="Enter Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small">Password</label>
                <input
                  type="password"
                  className="form-control auth-input"
                  placeholder="Enter Your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3 auth-meta-row">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <label
                    className="form-check-label small text-muted"
                    htmlFor="rememberMe"
                  >
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  className="btn btn-link p-0 small forgot-link text-decoration-none"
                  onClick={() => (window.location.href = "/forgot-password")}
                >
                  Forgot Password ?
                </button>
              </div>

              {errorMsg && (
                <div className="alert alert-danger py-2 small">{errorMsg}</div>
              )}

              <button
                type="submit"
                className="auth-submit-btn w-100"
                disabled={loading}
              >
                {loading
                  ? "Signing In..."
                  : selectedRole === "customer"
                    ? "Sign In as Customer"
                    : "Sign In as Vendor"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;