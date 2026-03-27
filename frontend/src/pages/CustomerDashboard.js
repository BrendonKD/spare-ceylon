import React, { useState, useEffect, useCallback } from "react";
import "./CustomerDashboard.css";
import Header from "../components/header.js";
import CustomerSidebar from "../components/CustomerSidebar.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

const useCounter = (target, duration = 900) => {
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

const StatCard = ({ icon, label, value, color, delay = 0 }) => {
  const count = useCounter(value, 900);
  return (
    <div className="cd-stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="cd-stat-icon" style={{ background: color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="cd-stat-body">
        <div className="cd-stat-value">{count}</div>
        <div className="cd-stat-label">{label}</div>
      </div>
      <div className="cd-stat-bar" style={{ background: color }} />
    </div>
  );
};

const OrderRow = ({ id, status, date, description, total, statusColor }) => (
  <div className="cd-order-row">
    <div className="cd-order-left">
      <div className="cd-order-id">#{id}</div>
      <div className="cd-order-desc">{description}</div>
      <div className="cd-order-date">{date}</div>
    </div>
    <div className="cd-order-right">
      <span className="cd-order-status" style={{ background: statusColor + "18", color: statusColor }}>
        {status}
      </span>
      <div className="cd-order-total">Rs. {total}</div>
      <button className="cd-order-btn">Details</button>
    </div>
  </div>
);

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ full_name: "Loading...", email: "..." });

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        const response = await axios.get(`${API}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser({ full_name: response.data.full_name, email: response.data.email });
      } catch (error) {
        console.error("Error fetching user data", error);
        if (error.response?.status === 401) handleLogout();
      }
    };
    fetchUserData();
  }, [navigate, handleLogout]);

  const firstName = user.full_name !== "Loading..." ? user.full_name.split(" ")[0] : "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const orders = [
    { id: "05001", status: "Out for Delivery", date: "10 / 11 / 2025", description: "Nissan Caravan Brake Light", total: "1,000.00", statusColor: "#0d9488" },
    { id: "05002", status: "Processing", date: "08 / 11 / 2025", description: "Toyota Corolla Air Filter", total: "2,500.00", statusColor: "#f59e0b" },
    { id: "05003", status: "Delivered", date: "01 / 11 / 2025", description: "Honda Civic Wiper Blades", total: "850.00", statusColor: "#10b981" },
  ];

  return (
    <div className="customer-dashboard">
      <Header />
      <div className="cd-layout">
        <CustomerSidebar user={user} handleLogout={handleLogout} activeItem="dashboard" />
        <main className="cd-main">
          {/* Welcome Banner */}
          <div className="cd-banner">
            <div className="cd-banner-content">
              <p className="cd-banner-greeting">{greeting},</p>
              <h2 className="cd-banner-name">{firstName || "there"}! 👋</h2>
              <p className="cd-banner-sub">Here's a summary of your activities today.</p>
            </div>
            <div className="cd-banner-decoration">
              <div className="cd-banner-circle cd-bc-1" />
              <div className="cd-banner-circle cd-bc-2" />
              <div className="cd-banner-circle cd-bc-3" />
              <span className="material-symbols-outlined cd-banner-icon">person</span>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="cd-stats-grid">
            <StatCard icon="local_shipping" label="Total Orders" value={10} color="linear-gradient(135deg,#0f766e,#0d9488)" delay={0} />
            <StatCard icon="favorite" label="Wishlist Items" value={5} color="linear-gradient(135deg,#be123c,#f43f5e)" delay={80} />
            <StatCard icon="storefront" label="Saved Vendors" value={5} color="linear-gradient(135deg,#1d4ed8,#3b82f6)" delay={160} />
            <StatCard icon="directions_car" label="My Vehicles" value={2} color="linear-gradient(135deg,#b45309,#f59e0b)" delay={240} />
          </div>

          {/* Orders + Promo */}
          <div className="cd-two-col">
            <div className="cd-card">
              <div className="cd-card-header">
                <span className="material-symbols-outlined">shopping_bag</span>
                <h6>Recent Orders</h6>
                <button className="cd-header-link ms-auto" onClick={() => navigate("/customer/orders")}>
                  View All <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div className="cd-orders-list">
                {orders.map((o) => (
                  <OrderRow key={o.id} {...o} />
                ))}
              </div>
            </div>

            <div className="cd-promo-card">
              <div className="cd-promo-decoration">
                <div className="cd-promo-circle cd-pc-1" />
                <div className="cd-promo-circle cd-pc-2" />
              </div>
              <div className="cd-promo-body">
                <span className="material-symbols-outlined cd-promo-icon">auto_awesome</span>
                <h5>Need Help Finding Parts?</h5>
                <p>Use our smart search to find parts by name or OEM number.</p>
                <button className="cd-promo-btn" onClick={() => navigate("/")}>
                  Start Searching <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;