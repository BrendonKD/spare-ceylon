import React, { useState } from "react";
import "./LoginPage.css";

const VendorRegisterPage = () => {
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
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
          email,
          phone,
          businessName,
          businessRegNo,
          address,
          description,
          password
        })
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
    <div className="auth-page container-fluid">
      <div className="row justify-content-center py-5">
        {/* LEFT: account type selector (vendor fixed) */}
        <div className="col-12 col-lg-5 mb-4 mb-lg-0">
          <div className="account-type-card">
            <div className="account-type-bg" />
            <div className="account-type-overlay">
              <h5 className="mb-4 text-center text-white">
                Choose Account Type
              </h5>

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

        {/* RIGHT: registration form */}
        <div className="col-12 col-lg-5">
          <div className="auth-card">
            <div className="auth-card-header text-center mb-4">
              <h5 className="mb-1">Welcome !</h5>
              <p className="mb-0 text-muted small">
                Create a new vendor account
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
                  <label className="form-label small">Contact First Name</label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small">Contact Last Name</label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small">Company Name</label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    placeholder="AutoParts.com"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small">
                    Business Registration No.
                  </label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    placeholder="B101000"
                    value={businessRegNo}
                    onChange={(e) => setBusinessRegNo(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
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

                <div className="col-12">
                  <label className="form-label small">Location / Address</label>
                  <input
                    type="text"
                    className="form-control auth-input"
                    placeholder="Colombo"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small">
                    Short Business Description
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    style={{ borderRadius: "16px" }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                  id="agreeVendorTerms"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <label
                  className="form-check-label small"
                  htmlFor="agreeVendorTerms"
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
                {loading ? "Creating vendor..." : "Register"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegisterPage;
