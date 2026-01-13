import React, { useState } from "react";
import "./LoginPage.css";

const CustomerRegisterPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState("");
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
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "customer",
          firstName,
          lastName,
          email,
          phone: contactNumber,
          location,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Redirect after success
      window.location.href = "/login";
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container-fluid">
      <div className="row justify-content-center py-5">
        {/* LEFT: account type selector (customer fixed) */}
        <div className="col-12 col-lg-5 mb-4 mb-lg-0">
          <div className="account-type-card">
            <div className="account-type-bg" />
            <div className="account-type-overlay">
              <h5 className="mb-4 text-center text-white">
                Choose Account Type
              </h5>

              <div className="row g-3">
                <div className="col-6">
                  <div className="account-type-option active">
                    <div className="type-icon customer-icon" />
                    <div className="mt-2 fw-semibold">Customer</div>
                  </div>
                </div>
                <div className="col-6">
                  <button
                    type="button"
                    className="account-type-option"
                    onClick={() => (window.location.href = "/register/vendor")}
                  >
                    <div className="type-icon vendor-icon" />
                    <div className="mt-2 fw-semibold">Vendor</div>
                  </button>
                </div>
              </div>

              <div className="selected-indicator">
                Customer account registration
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: registration form */}
        <div className="col-12 col-lg-5">
          <div className="auth-card">
            <div className="auth-card-header text-center mb-4">
              <h5 className="mb-1">Welcome !</h5>
              <p className="mb-0 text-muted small">
                Create a new customer account
              </p>
            </div>

            {/* Toggle Sign In / Register */}
            <div className="auth-toggle mb-4">
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
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small">First Name</label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small">Last Name</label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small">Email Address</label>
                  <input
                    type="email"
                    className="form-control auth-input"
                    placeholder="example1@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small">Contact Number</label>
                  <input
                    type="tel"
                    className="form-control auth-input"
                    placeholder="+94 77 111 2233"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small">Location</label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    placeholder="Colombo"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
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
              </div>

              <div className="form-check mt-3 mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="agreeTerms"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <label
                  className="form-check-label small"
                  htmlFor="agreeTerms"
                >
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
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegisterPage;
