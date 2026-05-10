import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Header from "../components/header";
import VendorSidebar from "../components/VendorSidebar";
import "./styles/VendorPayments.css";

const API = "http://localhost:5000";

const VendorPayments = () => {
  const [vendor, setVendor] = useState({
    full_name: "Loading...",
    email: "...",
    business_name: "",
    logo_url: ""
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPaymentsPage = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const [profileRes, ordersRes] = await Promise.all([
          axios.get(`${API}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API}/api/orders/vendor/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (profileRes.data.role !== "vendor") {
          window.location.href = "/login";
          return;
        }

        setVendor({
          full_name: profileRes.data.full_name,
          email: profileRes.data.email,
          business_name: profileRes.data.business_name || "",
          logo_url: profileRes.data.logo_url
          ? `${API}/${profileRes.data.logo_url.replace(/^\/+/, "")}`
          : ""
        });

        setOrders(ordersRes.data || []);
      } catch (err) {
        console.error("Error loading vendor payments page", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentsPage();
  }, []);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (methodFilter !== "all") {
      filtered = filtered.filter((o) => o.payment_method === methodFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((o) => {
        const listing = o.vendor_listing_id || {};
        const customer = o.customer_id || {};
        return (
          o._id?.toLowerCase().includes(q) ||
          listing.title?.toLowerCase().includes(q) ||
          customer.full_name?.toLowerCase().includes(q) ||
          customer.email?.toLowerCase().includes(q)
        );
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, methodFilter, statusFilter, searchTerm]);

  const cardPayments = filteredOrders.filter((o) => o.payment_method === "card");
  const codPayments = filteredOrders.filter((o) => o.payment_method === "cod");

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const cardRevenue = orders
    .filter((o) => o.payment_method === "card")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const codRevenue = orders
    .filter((o) => o.payment_method === "cod")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const paidOrdersCount = orders.filter((o) => o.payment_method === "card").length;

  const getStatusClass = (status) => {
    switch (status) {
      case "delivered":
        return "vp-badge success";
      case "shipped":
        return "vp-badge info";
      case "confirmed":
      case "pending":
        return "vp-badge warning";
      case "cancelled":
        return "vp-badge danger";
      default:
        return "vp-badge neutral";
    }
  };

  const renderPaymentCard = (order) => {
    const listing = order.vendor_listing_id || {};
    const customer = order.customer_id || {};

    return (
      <div className="vp-payment-card" key={order._id}>
        <div className="vp-payment-main">
          <div className="vp-payment-top">
            <div className="vp-order-meta">
              <span>Order ID: {order._id.slice(-6).toUpperCase()}</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <span className={getStatusClass(order.status)}>
              {order.status}
            </span>
          </div>

          <div className="vp-payment-title">
            {listing.title || "Order item"}
          </div>

          <div className="vp-payment-details">
            <span>Customer: {customer.full_name || "Unknown"}</span>
            <span>Qty: {order.quantity}</span>
            <span>Method: {order.payment_method === "card" ? "Card" : "COD"}</span>
          </div>
        </div>

        <div className="vp-payment-side">
          <div className="vp-amount-label">Order Total</div>
          <div className="vp-amount">Rs. {Number(order.total || 0).toLocaleString()}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="vendor-payments-page">
      <Header />

      <div className="vp-layout">
        <VendorSidebar vendor={vendor} activeItem="payments" />

        <main className="vp-main">
          <div className="vp-page-header">
            <h4 className="vp-page-title">Payments</h4>
            <p className="vp-page-subtitle">
              Review your order payments, monitor card transactions, and track cash on delivery orders.
            </p>
          </div>

          <div className="vp-stats-grid">
            <div className="vp-stat-card">
              <div className="vp-stat-label">Total Revenue</div>
              <div className="vp-stat-value">Rs. {totalRevenue.toLocaleString()}</div>
            </div>
            <div className="vp-stat-card">
              <div className="vp-stat-label">Card Payments</div>
              <div className="vp-stat-value text-success">Rs. {cardRevenue.toLocaleString()}</div>
            </div>
            <div className="vp-stat-card">
              <div className="vp-stat-label">COD Payments</div>
              <div className="vp-stat-value text-warning">Rs. {codRevenue.toLocaleString()}</div>
            </div>
            <div className="vp-stat-card">
              <div className="vp-stat-label">Paid Orders</div>
              <div className="vp-stat-value text-info">{paidOrdersCount}</div>
            </div>
          </div>

          <div className="vp-filter-panel">
            <div className="vp-filter-chips">
              <button
                className={`vp-chip ${methodFilter === "all" ? "active" : ""}`}
                onClick={() => setMethodFilter("all")}
              >
                All
              </button>
              <button
                className={`vp-chip ${methodFilter === "card" ? "active" : ""}`}
                onClick={() => setMethodFilter("card")}
              >
                Card Payments
              </button>
              <button
                className={`vp-chip ${methodFilter === "cod" ? "active" : ""}`}
                onClick={() => setMethodFilter("cod")}
              >
                COD Payments
              </button>
            </div>

            <div className="vp-filter-row">
              <input
                type="text"
                className="vp-search"
                placeholder="Search by order ID, product, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="vp-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="d-flex justify-content-center my-5">
              <div className="spinner-border text-success" />
            </div>
          ) : (
            <div className="vp-sections">
              <section className="vp-section">
                <div className="vp-section-header">
                  <h3>Card Payments</h3>
                  <span>{cardPayments.length} transactions</span>
                </div>

                {cardPayments.length === 0 ? (
                  <div className="vp-empty-state">No card payments found.</div>
                ) : (
                  <div className="vp-payment-list">
                    {cardPayments.map(renderPaymentCard)}
                  </div>
                )}
              </section>

              <section className="vp-section">
                <div className="vp-section-header">
                  <h3>Cash on Delivery</h3>
                  <span>{codPayments.length} transactions</span>
                </div>

                {codPayments.length === 0 ? (
                  <div className="vp-empty-state">No COD payments found.</div>
                ) : (
                  <div className="vp-payment-list">
                    {codPayments.map(renderPaymentCard)}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VendorPayments;