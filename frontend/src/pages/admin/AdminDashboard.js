import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDashboard.css";
import AdminHeader from "../admin/components/AdminHeader";
import AdminSidebar from "../admin/components/AdminSidebar";

const API = "http://localhost:5000";

const useCounter = (target, duration = 900) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const safeTarget = Number(target) || 0;
    const step = safeTarget / (duration / 16);

    const timer = setInterval(() => {
      start += step;
      if (start >= safeTarget) {
        setCount(safeTarget);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
};

const StatCard = ({ icon, label, value, color, delay = 0 }) => {
  const count = useCounter(value);

  return (
    <div className="ad-stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="ad-stat-icon" style={{ background: color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <div className="ad-stat-value">{count}</div>
        <div className="ad-stat-label">{label}</div>
      </div>
      <div className="ad-stat-bar" style={{ background: color }} />
    </div>
  );
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return "Just now";

  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then;

  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return then.toLocaleDateString();
};

const getActivityUI = (item) => {
  if (item?.entity_type === "vendor") {
    return { icon: "store", color: "#1d4ed8" };
  }
  if (item?.entity_type === "advertisement") {
    return { icon: "campaign", color: "#be123c" };
  }
  if (item?.entity_type === "listing") {
    return { icon: "inventory_2", color: "#7c3aed" };
  }
  if (item?.entity_type === "user") {
    return { icon: "group", color: "#0f766e" };
  }
  return { icon: "history", color: "#0f766e" };
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    pendingVendors: 0,
    activeListings: 0,
    pendingAds: 0,
    totalAds: 0,
  });

  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingAds, setPendingAds] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/admin/login");
  };

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "admin") {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    const fetchDashboard = async () => {
      try {
        setLoadingStats(true);
        setDashboardError("");

        const [statsRes, vendorsRes, adsRes, activityRes] = await Promise.all([
          axios.get(`${API}/api/admin/stats`, { headers }),
          axios.get(`${API}/api/admin/vendors/pending/list`, { headers }),
          axios.get(`${API}/api/ads?status=pending`, { headers }),
          axios.get(`${API}/api/admin/activity`, { headers }),
        ]);

        setStats({
          totalUsers: statsRes.data?.totalUsers || 0,
          totalVendors: statsRes.data?.totalVendors || 0,
          pendingVendors: statsRes.data?.pendingVendors || 0,
          activeListings: statsRes.data?.activeListings || 0,
          pendingAds: statsRes.data?.pendingAds || 0,
          totalAds: statsRes.data?.totalAds || 0,
        });

        setPendingVendors(Array.isArray(vendorsRes.data) ? vendorsRes.data.slice(0, 5) : []);
        setPendingAds(Array.isArray(adsRes.data) ? adsRes.data.slice(0, 5) : []);
        setRecentActivity(Array.isArray(activityRes.data) ? activityRes.data.slice(0, 6) : []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setDashboardError(
          err?.response?.data?.message || "Failed to load dashboard data."
        );
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboard();
  }, [token]);

  return (
    <div className="admin-dashboard">
      <AdminHeader onLogout={handleLogout} />

      <div className="ad-layout">
        <AdminSidebar activeItem="dashboard" />

        <main className="ad-main">
          <div className="ad-banner">
            <div className="ad-banner-content">
              <p className="ad-banner-greeting">Welcome back,</p>
              <h2 className="ad-banner-name">Administrator 👋</h2>
              <p className="ad-banner-sub">
                Here's what needs your attention today.
              </p>
            </div>
            <div className="ad-banner-deco">
              <div className="ad-bc ad-bc-1" />
              <div className="ad-bc ad-bc-2" />
              <span className="material-symbols-outlined ad-banner-icon">
                admin_panel_settings
              </span>
            </div>
          </div>

          {dashboardError && (
            <div className="alert alert-danger" role="alert">
              {dashboardError}
            </div>
          )}

          <div className="ad-stats-grid">
            <StatCard
              icon="group"
              label="Total Users"
              value={stats.totalUsers}
              color="linear-gradient(135deg,#0f766e,#0d9488)"
              delay={0}
            />
            <StatCard
              icon="store"
              label="Total Vendors"
              value={stats.totalVendors}
              color="linear-gradient(135deg,#1d4ed8,#3b82f6)"
              delay={80}
            />
            <StatCard
              icon="pending"
              label="Pending Vendors"
              value={stats.pendingVendors}
              color="linear-gradient(135deg,#b45309,#f59e0b)"
              delay={160}
            />
            <StatCard
              icon="inventory_2"
              label="Active Listings"
              value={stats.activeListings}
              color="linear-gradient(135deg,#7c3aed,#a78bfa)"
              delay={240}
            />
            <StatCard
              icon="campaign"
              label="Pending Ads"
              value={stats.pendingAds}
              color="linear-gradient(135deg,#be123c,#f43f5e)"
              delay={320}
            />
            <StatCard
              icon="verified"
              label="Total Ads"
              value={stats.totalAds}
              color="linear-gradient(135deg,#0d9488,#06b6d4)"
              delay={400}
            />
          </div>

          <div className="ad-two-col">
            <div className="ad-card">
              <div className="ad-card-header">
                <span className="material-symbols-outlined">store</span>
                <h6>Pending Vendor Approvals</h6>
                <button
                  className="ad-header-link ms-auto"
                  onClick={() => navigate("/admin/vendors")}
                >
                  View All
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>

              {loadingStats ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </div>
              ) : pendingVendors.length === 0 ? (
                <div className="ad-empty">
                  <span className="material-symbols-outlined">check_circle</span>
                  <p>No pending vendor approvals</p>
                </div>
              ) : (
                pendingVendors.map((v) => (
                  <div className="ad-list-row" key={v._id}>
                    <div
                      className="ad-list-icon"
                      style={{ background: "#1d4ed8" }}
                    >
                      <span className="material-symbols-outlined">store</span>
                    </div>
                    <div className="ad-list-body">
                      <div className="ad-list-title">{v.business_name}</div>
                      <div className="ad-list-sub">{v.address}</div>
                    </div>
                    <span className="badge bg-warning text-dark">Pending</span>
                  </div>
                ))
              )}
            </div>

            <div className="ad-card">
              <div className="ad-card-header">
                <span className="material-symbols-outlined">campaign</span>
                <h6>Pending Ad Requests</h6>
                <button
                  className="ad-header-link ms-auto"
                  onClick={() => navigate("/admin/ads")}
                >
                  View All
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>

              {loadingStats ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </div>
              ) : pendingAds.length === 0 ? (
                <div className="ad-empty">
                  <span className="material-symbols-outlined">check_circle</span>
                  <p>No pending ad requests</p>
                </div>
              ) : (
                pendingAds.map((a) => (
                  <div className="ad-list-row" key={a._id}>
                    <div
                      className="ad-list-icon"
                      style={{ background: "#be123c" }}
                    >
                      <span className="material-symbols-outlined">campaign</span>
                    </div>
                    <div className="ad-list-body">
                      <div className="ad-list-title">{a.title}</div>
                      <div className="ad-list-sub">
                        {a.slot} slot · {a.duration_days} days
                      </div>
                    </div>
                    <span className="badge bg-warning text-dark">Pending</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="ad-card">
            <div className="ad-card-header">
              <span className="material-symbols-outlined">history</span>
              <h6>Recent Activity</h6>
            </div>

            <div className="ad-activity-list">
              {loadingStats ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="ad-empty">
                  <span className="material-symbols-outlined">history</span>
                  <p>No recent activity found</p>
                </div>
              ) : (
                recentActivity.map((item) => {
                  const ui = getActivityUI(item);

                  return (
                    <div className="ad-activity-item" key={item._id}>
                      <div
                        className="ad-activity-icon"
                        style={{ background: ui.color }}
                      >
                        <span className="material-symbols-outlined">
                          {ui.icon}
                        </span>
                      </div>
                      <div className="ad-activity-text">
                        <p>{item.message}</p>
                        <span>{formatTimeAgo(item.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;