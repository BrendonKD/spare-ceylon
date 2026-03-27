import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminLogin.css";

const API = "http://localhost:5000";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, {
        ...form, role: "admin"
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role",  "admin");
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container-fluid">
      <div className="row justify-content-center py-5">

        {/* LEFT — Admin identity panel */}
        <div className="col-12 col-lg-5 mb-4 mb-lg-0">
          <div className="admin-panel-card">

            {/* Background image layer */}
            <div className="admin-panel-bg" />

            {/* Dark overlay */}
            <div className="admin-panel-overlay">

              {/* Top badge */}
              <div className="admin-badge">
                <span className="material-symbols-outlined">shield_person</span>
              </div>

              {/* Centre text */}
              <div className="admin-panel-center">
                <div className="admin-panel-title">Administrator</div>
                <div className="admin-panel-sub">Spare Ceylon Control Center</div>

                {/* Feature chips */}
                <div className="admin-chips">
                  {[
                    { icon: "manage_accounts", label: "Vendor Management" },
                    { icon: "campaign",        label: "Ad Approvals" },
                    { icon: "inventory_2",     label: "Listings Control" },
                    { icon: "bar_chart",       label: "Platform Analytics" },
                  ].map(({ icon, label }) => (
                    <div className="admin-chip" key={label}>
                      <span className="material-symbols-outlined">{icon}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom tagline */}
              <p className="admin-panel-tagline">
                Restricted access — authorised personnel only
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Sign-in form (identical structure to LoginPage) */}
        <div className="col-12 col-lg-5">
          <div className="auth-card">

            <div className="auth-card-header text-center mb-4">
              <h5 className="mb-1">Admin Sign In</h5>
              <p className="mb-0 text-muted small">
                Enter your administrator credentials to continue
              </p>
            </div>

            {/* Role pill — static, non-clickable */}
            <div className="auth-toggle mb-4">
              <button className="al-toggle-btn active" type="button">
                Administrator
              </button>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small">
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control auth-input"
                  placeholder="admin@spareceylon.lk"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="form-label small">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-control auth-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="al-auth-submit-btn w-100"
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Signing in...</>
                  : "Sign In to Admin Panel"
                }
              </button>
            </form>

            <div className="text-center mt-3">
              <span className="al-back small text-muted" onClick={() => navigate("/")}>
                ← Back to Home
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;