import React, { useState } from "react";
import "./LoginPage.css";

const VendorRegisterPage = () => {
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!agree) {
      setErrorMsg("You must agree to the Terms and Conditions.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactFirstName,
          contactLastName,
          businessName,
          email,
          phone,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Vendor registration failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", "vendor");
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.href = "/vendor/dashboard";
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page register-page container-fluid">
      <div className="row justify-content-center py-2">
        {/* LEFT */}
        <div className="col-12 col-lg-5 mb-4 mb-lg-0">
          <div className="account-type-card">
            <div className="account-type-bg" />
            <div className="account-type-overlay">
              <h5 className="mb-4 text-center text-white">Choose Account Type</h5>

              <div className="row g-3">
                <div className="col-6">
                  <button
                    type="button"
                    className="account-type-option"
                    onClick={() => (window.location.href = "/register/customer")}
                  >
                    <div className="type-icon customer-icon" />
                    <div className="mt-2 fw-semibold">Customer</div>
                  </button>
                </div>

                <div className="col-6">
                  <div className="account-type-option active">
                    <div className="tick-mark">✓</div>
                    <div className="type-icon vendor-icon" />
                    <div className="mt-2 fw-semibold">Vendor</div>
                  </div>
                </div>
              </div>

              <div className="selected-indicator">
                Vendor account registration
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-12 col-lg-5">
          <div className="auth-card register-auth-card">
            <div className="auth-card-header text-center mb-3">
              <h5 className="mb-1">Welcome !</h5>
              <p className="mb-1 text-muted small">Create your vendor account</p>
              <p className="mb-0 small register-helper-text">
                You can complete business details later in your dashboard profile.
              </p>
            </div>

            <div className="auth-toggle mb-3">
              <button
                className="toggle-btn"
                type="button"
                onClick={() => (window.location.href = "/login")}
              >
                Sign In
              </button>
              <button className="toggle-btn active" type="button">
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label className="form-label small">First Name</label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small">Last Name</label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small">Business Name</label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    placeholder="Auto Parts Lanka"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small">Email Address</label>
                  <input
                    type="email"
                    className="form-control auth-input"
                    placeholder="vendor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small">Contact Number</label>
                  <input
                    type="tel"
                    className="form-control auth-input"
                    placeholder="+94 77 111 2233"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small">Password</label>
                  <input
                    type="password"
                    className="form-control auth-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-check mt-3 mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="agreeVendorTerms"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="agreeVendorTerms">
                  Agree <span className="text-danger">Terms And Conditions</span>
                </label>
              </div>

              {errorMsg && (
                <div className="alert alert-danger py-2 small">{errorMsg}</div>
              )}

              <button
                type="submit"
                className="auth-submit-btn w-100 mt-2"
                disabled={loading}
              >
                {loading ? "Creating vendor..." : "Create Vendor Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegisterPage;