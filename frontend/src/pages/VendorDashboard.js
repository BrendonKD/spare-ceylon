import React, { useEffect, useState } from "react";
import "./styles/VendorDashboard.css";
import Header from "../components/header";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import VendorSidebar from "../components/VendorSidebar";

const API = "http://localhost:5000";

// Animated counter hook
const useCounter = (target, duration = 1000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

// Stat Card
const StatCard = ({ icon, label, value, color, delay = 0 }) => {
  const count = useCounter(value, 900);
  return (
    <div className="vd-stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="vd-stat-icon" style={{ background: color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="vd-stat-body">
        <div className="vd-stat-value">{count}</div>
        <div className="vd-stat-label">{label}</div>
      </div>
      <div className="vd-stat-bar" style={{ background: color }} />
    </div>
  );
};


// ---------------------------------------------------------------------------
// VendorDashboard
// ---------------------------------------------------------------------------
const VendorDashboard = () => {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState({ full_name: "Loading...", email: "...", business_name: "", logo_url: "" });
  const [listings, setListings] = useState({ total: 0, active: 0, inactive: 0 });
  const [loadingListings, setLoadingListings] = useState(true);
  const token = localStorage.getItem("token");

  // Fetch vendor profile
  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.role !== "vendor") { navigate("/login"); return; }
        setVendor({
          full_name: res.data.full_name,
          email: res.data.email,
          business_name: res.data.business_name || "",
          logo_url: res.data.logo_url
            ? `${API}/${res.data.logo_url.replace(/^\/+/, "")}`
            : ""
        });
      } catch (err) {
        console.error("Vendor profile error", err.response?.data || err.message);
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate, token]);

  // Fetch vendor's own listings for stats
  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/api/vendor/listings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        const data = res.data;
        setListings({
          total: data.length,
          active: data.filter((l) => l.status === "active").length,
          inactive: data.filter((l) => l.status === "inactive").length
        });
      })
      .catch(console.error)
      .finally(() => setLoadingListings(false));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  // First name for greeting
  const firstName = vendor.business_name;

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="vendor-dashboard">
      <Header />

      <div className="vd-layout">
        {/* Sidebar */}
        <VendorSidebar vendor={vendor} activeItem="dashboard" onLogout={handleLogout} />

        {/* Main */}
        <main className="vd-main">

          {/* ── Welcome Banner ────────────────────────────────────── */}
          <div className="vd-banner">
            <div className="vd-banner-content">
              <p className="vd-banner-greeting">{greeting},</p>
              <h2 className="vd-banner-name">{firstName}! 👋</h2>
              <p className="vd-banner-sub">
                Here's what's happening with your store today.
              </p>
            </div>
            <div className="vd-banner-decoration">
              <div className="vd-banner-circle vd-bc-1" />
              <div className="vd-banner-circle vd-bc-2" />
              <div className="vd-banner-circle vd-bc-3" />
              <span className="material-symbols-outlined vd-banner-icon">storefront</span>
            </div>
          </div>

          {/* ── Stat Cards ────────────────────────────────────────── */}
          <div className="vd-stats-grid">
            <StatCard icon="local_shipping" label="Pending Orders" value={10} color="linear-gradient(135deg,#0f766e,#0d9488)" delay={0} />
            <StatCard icon="task_alt" label="Completed Orders" value={24} color="linear-gradient(135deg,#1d4ed8,#3b82f6)" delay={80} />
            <StatCard icon="mail" label="New Messages" value={5} color="linear-gradient(135deg,#7c3aed,#a78bfa)" delay={160} />
            <StatCard icon="payments" label="Payments Received" value={2} color="linear-gradient(135deg,#b45309,#f59e0b)" delay={240} />
          </div>

          {/* ── Listed Items + Performance ────────────────────────── */}
          <div className="vd-two-col">

            {/* Listings breakdown */}
            <div className="vd-card">
              <div className="vd-card-header">
                <span className="material-symbols-outlined">inventory_2</span>
                <h6>Listed Items</h6>
              </div>

              {loadingListings ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </div>
              ) : (
                <>
                  <div className="vd-listings-big">{listings.total}</div>
                  <div className="vd-listings-label">Total Listings</div>

                  <div className="vd-listings-breakdown">
                    <div className="vd-lb-item vd-lb-active">
                      <div className="vd-lb-dot" />
                      <div>
                        <div className="vd-lb-val">{listings.active}</div>
                        <div className="vd-lb-key">Active</div>
                      </div>
                    </div>
                    <div className="vd-lb-divider" />
                    <div className="vd-lb-item vd-lb-inactive">
                      <div className="vd-lb-dot" />
                      <div>
                        <div className="vd-lb-val">{listings.inactive}</div>
                        <div className="vd-lb-key">Inactive</div>
                      </div>
                    </div>
                    <div className="vd-lb-divider" />
                    <div className="vd-lb-item vd-lb-pending">
                      <div className="vd-lb-dot" />
                      <div>
                        <div className="vd-lb-val">0</div>
                        <div className="vd-lb-key">Pending</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="vd-progress-wrap mt-3">
                    <div className="vd-progress-bar">
                      <div
                        className="vd-progress-fill"
                        style={{ width: listings.total ? `${(listings.active / listings.total) * 100}%` : "0%" }}
                      />
                    </div>
                    <small className="text-muted">
                      {listings.total ? Math.round((listings.active / listings.total) * 100) : 0}% active
                    </small>
                  </div>

                  <button
                    className="vd-card-action-btn mt-3"
                    onClick={() => navigate("/vendor/list-products")}
                  >
                    Manage Listings
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </>
              )}
            </div>

            {/* Performance overview */}
            <div className="vd-card vd-performance-card">
              <div className="vd-card-header">
                <span className="material-symbols-outlined">bar_chart</span>
                <h6>Performance Overview</h6>
              </div>

              <div className="vd-perf-bars">
                {[
                  { label: "Mon", val: 40 },
                  { label: "Tue", val: 65 },
                  { label: "Wed", val: 50 },
                  { label: "Thu", val: 80 },
                  { label: "Fri", val: 55 },
                  { label: "Sat", val: 90 },
                  { label: "Sun", val: 30 },
                ].map(({ label, val }) => (
                  <div className="vd-bar-col" key={label}>
                    <div className="vd-bar-track">
                      <div className="vd-bar-fill" style={{ height: `${val}%` }} />
                    </div>
                    <div className="vd-bar-label">{label}</div>
                  </div>
                ))}
              </div>

              <p className="vd-perf-note">
                <span className="material-symbols-outlined">info</span>
                Weekly view counts across your listings. Connect orders data for full analytics.
              </p>
            </div>
          </div>

          {/* ── Recent Activity ───────────────────────────────────── */}
          <div className="vd-card vd-activity-card">
            <div className="vd-card-header">
              <span className="material-symbols-outlined">history</span>
              <h6>Recent Activity</h6>
            </div>
            <div className="vd-activity-list">
              {[
                { icon: "add_box", color: "#0f766e", text: "New listing published — Genuine brake pads Toyota", time: "2h ago" },
                { icon: "local_shipping", color: "#1d4ed8", text: "Order #1042 dispatched to Colombo", time: "5h ago" },
                { icon: "payments", color: "#b45309", text: "Payment of LKR 7,500 received", time: "Yesterday" },
                { icon: "campaign", color: "#7c3aed", text: "Advertisement approved — Engine Parts Sale", time: "2 days ago" },
              ].map(({ icon, color, text, time }, i) => (
                <div className="vd-activity-item" key={i}>
                  <div className="vd-activity-icon" style={{ background: color }}>
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>
                  <div className="vd-activity-text">
                    <p>{text}</p>
                    <span>{time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;