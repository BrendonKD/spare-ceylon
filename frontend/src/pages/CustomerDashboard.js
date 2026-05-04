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

const OrderRow = ({
  id,
  status,
  orderDate,
  storeName,
  productImage,
  title,
  variant,
  qty,
  total,
  onViewDetail
}) => (
  <div className="cd-order-card">
    {/* Top header row */}
    <div className="cd-order-card-header">
      <span className="cd-order-status-text">{status}</span>
      <div className="cd-order-meta">
        <span className="cd-order-meta-item">
          Order date: {orderDate}
        </span>
        <span className="cd-order-meta-item">
          Order ID: {id.slice(-6).toUpperCase()}
        </span>
      </div>
    </div>

    {/* Main row: image + details + total */}
    <div className="cd-order-card-body">
      <div className="cd-order-product-left">
        <div className="cd-order-store">
          <span className="cd-order-store-name">{storeName}</span>
        </div>

        <div className="cd-order-product-row">
          <div className="cd-order-product-image">
            <img
              src={productImage}
              alt={title}
            />
          </div>
          <div className="cd-order-product-info">
            <div className="cd-order-title">{title}</div>
            {variant && (
              <div className="cd-order-variant">{variant}</div>
            )}
            <div className="cd-order-qty">Qty: {qty}</div>
          </div>
        </div>
      </div>

      <div className="cd-order-total-right">
        <div className="cd-order-total-label">Total:</div>
        <div className="cd-order-total-value">
          Rs. {total}
        </div>
        <button
          className="btn btn-outline-success btn-sm mt-2 d-flex align-items-center gap-1"
          onClick={onViewDetail}
        >
          View detail
        </button>
      </div>
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

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const [userRes, ordersRes] = await Promise.all([
          axios.get(`${API}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/api/orders/my-recent`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setUser({
          full_name: userRes.data.full_name,
          email: userRes.data.email
        });

        setOrders(ordersRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
        if (error.response?.status === 401) handleLogout();
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, handleLogout]);

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
                {ordersLoading ? (
                  <p>Loading recent orders...</p>
                ) : orders.length === 0 ? (
                  <p>No recent orders yet.</p>
                ) : (
                  orders.map((o) => {
                    const listing = o.vendor_listing_id || {};
                    const imageUrl = listing.image_url
                      ? `${API}/${listing.image_url}`
                      : "/placeholder.jpg";

                    return (
                      <OrderRow
                        key={o._id}
                        id={o._id}
                        status={o.status || "Completed"}
                        orderDate={new Date(o.createdAt).toLocaleDateString()}
                        storeName={listing.vendor?.name || "Store"}
                        productImage={imageUrl}
                        title={listing.title || "Order item"}
                        variant={listing.condition}
                        qty={o.quantity}
                        total={o.total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                        onViewDetail={() => navigate(`/customer/orders/${o._id}`)}
                      />
                    );
                  })
                )}
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