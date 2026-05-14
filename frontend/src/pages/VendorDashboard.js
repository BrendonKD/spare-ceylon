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
    const finalTarget = Number(target) || 0;
    const step = finalTarget / (duration / 16);

    const timer = setInterval(() => {
      start += step;
      if (start >= finalTarget) {
        setCount(finalTarget);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
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

const VendorDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [vendor, setVendor] = useState({
    full_name: "Loading...",
    email: "...",
    business_name: "",
    logo_url: "",
  });

  const [listings, setListings] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
  });

  const [dashboardStats, setDashboardStats] = useState({
    pending: 0,
    active: 0,
    lowStock: 0,
    stockUnits: 0,
  });

  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const formatActivityTime = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    return date.toLocaleString();
  };

  // Fetch vendor profile
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.role !== "vendor") {
          navigate("/login");
          return;
        }

        setVendor({
          full_name: res.data.full_name,
          email: res.data.email,
          business_name: res.data.business_name || "",
          logo_url: res.data.logo_url
            ? `${API}/${res.data.logo_url.replace(/^\/+/, "")}`
            : "",
        });
      } catch (err) {
        console.error("Vendor profile error", err.response?.data || err.message);
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate, token]);

  // Fetch listing breakdown
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API}/api/vendor/listings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;

        setListings({
          total: data.length,
          active: data.filter((l) => l.status === "active").length,
          inactive: data.filter((l) => l.status === "inactive").length,
          pending: data.filter((l) => l.status === "pending_product_approval").length,
        });
      })
      .catch(console.error)
      .finally(() => setLoadingListings(false));
  }, [token]);

  // Fetch dashboard summary
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API}/api/vendor-dashboard/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setDashboardStats(res.data.stats || {
          pending: 0,
          active: 0,
          lowStock: 0,
          stockUnits: 0,
        });

        setWeeklyActivity(res.data.weeklyActivity || []);
        setRecentActivity(res.data.recentActivity || []);
      })
      .catch((err) => {
        console.error("Dashboard summary error", err.response?.data || err.message);
      })
      .finally(() => setLoadingDashboard(false));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  const firstName = vendor.business_name || vendor.full_name || "Vendor";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const maxWeeklyCount = Math.max(...weeklyActivity.map((d) => d.count || 0), 1);

  return (
    <div className="vendor-dashboard">
      <Header className="sticky-top" />

      <div className="vd-layout">
        <VendorSidebar
          vendor={vendor}
          activeItem="dashboard"
          onLogout={handleLogout}
        />

        <main className="vd-main">
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
              <span className="material-symbols-outlined vd-banner-icon">
                storefront
              </span>
            </div>
          </div>

          <div className="vd-stats-grid">
            <StatCard
              icon="hourglass_top"
              label="Pending product Approval"
              value={dashboardStats.pending}
              color="linear-gradient(135deg,#7c3aed,#a78bfa)"
              delay={0}
            />
            <StatCard
              icon="task_alt"
              label="Active Listings"
              value={dashboardStats.active}
              color="linear-gradient(135deg,#1d4ed8,#3b82f6)"
              delay={80}
            />
            <StatCard
              icon="warning"
              label="Low Stock Items"
              value={dashboardStats.lowStock}
              color="linear-gradient(135deg,#b45309,#f59e0b)"
              delay={160}
            />
            <StatCard
              icon="inventory_2"
              label="Stock Units"
              value={dashboardStats.stockUnits}
              color="linear-gradient(135deg,#0f766e,#0d9488)"
              delay={240}
            />
          </div>

          <div className="vd-two-col">
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
                        <div className="vd-lb-val">{listings.pending}</div>
                        <div className="vd-lb-key">Pending</div>
                      </div>
                    </div>
                  </div>

                  <div className="vd-progress-wrap mt-3">
                    <div className="vd-progress-bar">
                      <div
                        className="vd-progress-fill"
                        style={{
                          width: listings.total
                            ? `${(listings.active / listings.total) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <small className="text-muted">
                      {listings.total
                        ? Math.round((listings.active / listings.total) * 100)
                        : 0}
                      % active
                    </small>
                  </div>

                  <button
                    className="vd-card-action-btn mt-3"
                    onClick={() => navigate("/vendor/list-products")}
                  >
                    Manage Listings
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>
                </>
              )}
            </div>

            <div className="vd-card vd-performance-card">
              <div className="vd-card-header">
                <span className="material-symbols-outlined">bar_chart</span>
                <h6>Listing Activity</h6>
              </div>

              {loadingDashboard ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </div>
              ) : (
                <div className="vd-perf-bars">
                  {weeklyActivity.length === 0 ? (
                    <div className="text-muted py-3">No activity found.</div>
                  ) : (
                    weeklyActivity.map(({ label, count }, index) => {
                      const height = ((count || 0) / maxWeeklyCount) * 100;

                      return (
                        <div className="vd-bar-col" key={`${label}-${index}`}>
                          <div className="vd-bar-track">
                            <div
                              className="vd-bar-fill"
                              style={{ height: `${height}%` }}
                              title={`${count} listings`}
                            />
                          </div>
                          <div className="vd-bar-label">{label}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              <p className="vd-perf-note">
                <span className="material-symbols-outlined">info</span>
                Listings created in the last 7 days.
              </p>
            </div>
          </div>

          <div className="vd-card vd-activity-card">
            <div className="vd-card-header">
              <span className="material-symbols-outlined">history</span>
              <h6>Recent Activity</h6>
            </div>

            <div className="vd-activity-list">
              {loadingDashboard ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-muted">No recent activity found.</p>
              ) : (
                recentActivity.map(({ icon, color, text, time }, i) => (
                  <div className="vd-activity-item" key={i}>
                    <div
                      className="vd-activity-icon"
                      style={{ background: color }}
                    >
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>

                    <div className="vd-activity-text">
                      <p>{text}</p>
                      <span>{formatActivityTime(time)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;