// src/pages/CustomerOrders.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/header";
import CustomerSidebar from "../components/CustomerSidebar";
import "./CustomerOrders.css";

const API = "http://localhost:5000";

const CustomerOrders = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({ full_name: "Loading...", email: "..." });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch profile + all orders
  useEffect(() => {
    const fetchOrdersPageData = async () => {
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
          axios.get(`${API}/api/orders/my`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setUser({
          full_name: userRes.data.full_name,
          email: userRes.data.email
        });

        setOrders(ordersRes.data);
      } catch (err) {
        console.error("Error loading orders page", err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersPageData();
  }, [navigate]);

  // summary stats
  const totalOrders = orders.length;
  const processingCount = orders.filter(
    (o) => o.status === "pending" || o.status === "confirmed"
  ).length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  const statusBadgeClass = (status) => {
    switch (status) {
      case "delivered":
        return "badge bg-success-subtle text-success border-success-subtle";
      case "shipped":
        return "badge bg-info-subtle text-info border-info-subtle";
      case "confirmed":
      case "pending":
        return "badge bg-warning-subtle text-warning border-warning-subtle";
      case "cancelled":
        return "badge bg-danger-subtle text-danger border-danger-subtle";
      default:
        return "badge bg-secondary-subtle text-secondary border-secondary-subtle";
    }
  };

  return (
    <div className="customer-dashboard">
      <Header />
      <div className="cd-layout">
        <CustomerSidebar user={user} activeItem="orders" />
        <main className="cd-main co-main">
          {/* Top summary cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card co-stat-card h-100">
                <div className="card-body">
                  <div className="small text-muted mb-1">Total Orders</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-success">
                      shopping_bag
                    </span>
                    <span className="co-stat-number">{totalOrders}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card co-stat-card h-100">
                <div className="card-body">
                  <div className="small text-muted mb-1">Processing</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-warning">
                      hourglass_top
                    </span>
                    <span className="co-stat-number">{processingCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card co-stat-card h-100">
                <div className="card-body">
                  <div className="small text-muted mb-1">Shipped</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-info">
                      local_shipping
                    </span>
                    <span className="co-stat-number">{shippedCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card co-stat-card h-100">
                <div className="card-body">
                  <div className="small text-muted mb-1">Delivered</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-success">
                      task_alt
                    </span>
                    <span className="co-stat-number">{deliveredCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders list */}
          <div className="card co-list-card">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <span className="material-symbols-outlined me-2 text-success">
                  receipt_long
                </span>
                <h5 className="mb-0">My Orders</h5>
              </div>

              {loading ? (
                <div className="d-flex justify-content-center my-4">
                  <div className="spinner-border text-success" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-muted small mb-0">
                  You have not placed any orders yet.
                </p>
              ) : (
                <div className="co-orders-list">
                  {orders.map((o) => {
                    const listing = o.vendor_listing_id || {};
                    const imageUrl = listing.image_url
                      ? `${API}/${listing.image_url}`
                      : "/placeholder.jpg";

                    return (
                      <div className="co-order-item card mb-3" key={o._id}>
                        <div className="card-body">
                          {/* meta row */}
                          <div className="d-flex flex-wrap align-items-center mb-2 gap-2">
                            <div className="d-flex align-items-center gap-1 small text-muted">

                              <span>Order ID: {o._id.slice(-6).toUpperCase()}</span>
                            </div>

                            <span className="small text-muted ms-md-3">
                              Placed on:{" "}
                              {new Date(o.createdAt).toLocaleDateString()}
                            </span>

                            <span className="small text-muted ms-md-3">
                              Payment:{" "}
                              {o.payment_method === "card"
                                ? "Credit / Debit Card"
                                : "Cash on Delivery"}
                            </span>

                            <span className="ms-auto">
                              <span className={statusBadgeClass(o.status)}>
                                {o.status.charAt(0).toUpperCase() +
                                  o.status.slice(1)}
                              </span>
                            </span>
                          </div>

                          {/* main row */}
                          <div className="d-flex flex-wrap align-items-center gap-3">
                            <div className="co-order-image">
                              <img src={imageUrl} alt={listing.title} />
                            </div>

                            <div className="flex-grow-1">
                              <div className="co-order-title">
                                {listing.title || "Order item"}
                              </div>
                              <div className="co-order-meta small text-muted">
                                Price: Rs.{" "}
                                {listing.price?.toLocaleString() || "N/A"}{" "}
                                &nbsp; | &nbsp; Qty: {o.quantity}
                              </div>
                            </div>

                            <div className="text-end ms-auto">
                              <div className="text-muted small">Order Total</div>
                              <div className="fw-semibold text-success">
                                Rs. {o.total.toLocaleString()}
                              </div>
                              <button
                                className="btn btn-success btn-sm mt-2 d-flex align-items-center justify-content-center gap-1"
                                onClick={() =>
                                  navigate(`/customer/orders/${o._id}`)
                                }
                              >
                                Order Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerOrders;