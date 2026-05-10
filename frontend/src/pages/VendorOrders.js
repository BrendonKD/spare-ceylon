import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Header from "../components/header";
import VendorSidebar from "../components/VendorSidebar";
import "./styles/VendorOrders.css";

const API = "http://localhost:5000";

const STATUS_OPTIONS = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
];

const VendorOrders = () => {
    const [vendor, setVendor] = useState({
        full_name: "Loading...",
        email: "...",
        business_name: "",
        logo_url: ""
    });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("latest");

    const [statusValues, setStatusValues] = useState({});
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    useEffect(() => {
        const fetchVendorOrdersPage = async () => {
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

                setOrders(ordersRes.data);

                const initialStatuses = {};
                ordersRes.data.forEach((order) => {
                    initialStatuses[order._id] = order.status;
                });
                setStatusValues(initialStatuses);
            } catch (err) {
                console.error("Error loading vendor orders page", err);
            } finally {
                setLoading(false);
            }
        };

        fetchVendorOrdersPage();
    }, []);

    const totalOrders = orders.length;
    const processingCount = orders.filter(
        (o) => o.status === "pending" || o.status === "confirmed"
    ).length;
    const shippedCount = orders.filter((o) => o.status === "shipped").length;
    const deliveredCount = orders.filter((o) => o.status === "delivered").length;

    const filteredOrders = useMemo(() => {
        let filtered = [...orders];

        if (statusFilter !== "all") {
            filtered = filtered.filter((o) => o.status === statusFilter);
        }

        if (paymentFilter !== "all") {
            filtered = filtered.filter((o) => o.payment_method === paymentFilter);
        }

        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            filtered = filtered.filter((o) => {
                const listing = o.vendor_listing_id || {};
                const customer = o.customer_id || {};
                return (
                    o._id.toLowerCase().includes(query) ||
                    (listing.title || "").toLowerCase().includes(query) ||
                    (customer.full_name || "").toLowerCase().includes(query) ||
                    (customer.email || "").toLowerCase().includes(query) ||
                    (o.shipping_address?.city || "").toLowerCase().includes(query)
                );
            });
        }

        if (sortBy === "latest") {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === "oldest") {
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortBy === "highest") {
            filtered.sort((a, b) => b.total - a.total);
        } else if (sortBy === "lowest") {
            filtered.sort((a, b) => a.total - b.total);
        }

        return filtered;
    }, [orders, statusFilter, paymentFilter, searchTerm, sortBy]);

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

    const handleStatusSelect = (orderId, value) => {
        setStatusValues((prev) => ({
            ...prev,
            [orderId]: value,
        }));
    };

    const handleStatusUpdate = async (orderId) => {
        try {
            const token = localStorage.getItem("token");
            const nextStatus = statusValues[orderId];

            setUpdatingOrderId(orderId);

            const res = await axios.patch(
                `${API}/api/orders/vendor/${orderId}/status`,
                { status: nextStatus },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const updatedOrder = res.data.order;

            setOrders((prev) =>
                prev.map((order) => (order._id === orderId ? updatedOrder : order))
            );

            setStatusValues((prev) => ({
                ...prev,
                [orderId]: updatedOrder.status,
            }));
        } catch (err) {
            console.error("Failed to update order status", err);
            alert(err.response?.data?.message || "Failed to update order status");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    return (
        <div className="vendor-orders-page">
            <Header />

            <div className="vo-layout">
                <VendorSidebar vendor={vendor} activeItem="manage-orders" />

                <main className="vo-main">
                    <div className="vo-page-header">
                        <h2 className="vo-page-title">Manage Orders</h2>
                        <p className="vo-page-subtitle">
                            Review, filter, and update customer order statuses.
                        </p>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className="vo-stat-card">
                                <div className="small text-muted mb-1">Total Orders</div>
                                <div className="vo-stat-value">{totalOrders}</div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="vo-stat-card">
                                <div className="small text-muted mb-1">Processing</div>
                                <div className="vo-stat-value text-warning">{processingCount}</div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="vo-stat-card">
                                <div className="small text-muted mb-1">Shipped</div>
                                <div className="vo-stat-value text-info">{shippedCount}</div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="vo-stat-card">
                                <div className="small text-muted mb-1">Delivered</div>
                                <div className="vo-stat-value text-success">{deliveredCount}</div>
                            </div>
                        </div>
                    </div>

                    <div className="vo-list-card">
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-symbols-outlined me-2 text-success">
                                inventory_2
                            </span>
                            <h5 className="mb-0">Vendor Orders</h5>
                        </div>

                        <div className="vo-filters mb-3">
                            <div className="vo-filter-chips">
                                <button
                                    className={`vo-chip ${statusFilter === "all" ? "active" : ""}`}
                                    onClick={() => setStatusFilter("all")}
                                >
                                    All
                                </button>
                                <button
                                    className={`vo-chip ${statusFilter === "pending" ? "active" : ""}`}
                                    onClick={() => setStatusFilter("pending")}
                                >
                                    Pending
                                </button>
                                <button
                                    className={`vo-chip ${statusFilter === "confirmed" ? "active" : ""}`}
                                    onClick={() => setStatusFilter("confirmed")}
                                >
                                    Confirmed
                                </button>
                                <button
                                    className={`vo-chip ${statusFilter === "shipped" ? "active" : ""}`}
                                    onClick={() => setStatusFilter("shipped")}
                                >
                                    Shipped
                                </button>
                                <button
                                    className={`vo-chip ${statusFilter === "delivered" ? "active" : ""}`}
                                    onClick={() => setStatusFilter("delivered")}
                                >
                                    Delivered
                                </button>
                                <button
                                    className={`vo-chip ${statusFilter === "cancelled" ? "active" : ""}`}
                                    onClick={() => setStatusFilter("cancelled")}
                                >
                                    Cancelled
                                </button>
                            </div>

                            <div className="vo-filter-controls">
                                <input
                                    type="text"
                                    className="vo-search"
                                    placeholder="Search by order, product, customer, city..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />

                                <select
                                    className="vo-select"
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                >
                                    <option value="all">All Payments</option>
                                    <option value="card">Card</option>
                                    <option value="cod">Cash on Delivery</option>
                                </select>

                                <select
                                    className="vo-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="highest">Highest Total</option>
                                    <option value="lowest">Lowest Total</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="d-flex justify-content-center my-4">
                                <div className="spinner-border text-success" />
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <p className="text-muted small mb-0">
                                No orders found for the selected filters.
                            </p>
                        ) : (
                            <div className="vo-orders-list">
                                {filteredOrders.map((o) => {
                                    const listing = o.vendor_listing_id || {};
                                    const customer = o.customer_id || {};
                                    const imageUrl = listing.image_url
                                        ? `${API}/${listing.image_url.replace(/^\/+/, "")}`
                                        : "/placeholder.jpg";

                                    return (
                                        <div className="vo-order-item" key={o._id}>
                                            <div className="vo-order-top">
                                                <div className="d-flex flex-wrap gap-3 align-items-center">
                                                    <span className="small text-muted">
                                                        Order ID: {o._id.slice(-6).toUpperCase()}
                                                    </span>
                                                    <span className="small text-muted">
                                                        Placed: {new Date(o.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="small text-muted">
                                                        Payment: {o.payment_method === "card" ? "Card" : "COD"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="vo-order-body compact">
                                                <div className="vo-order-image">
                                                    <img src={imageUrl} alt={listing.title || "Order item"} />
                                                </div>

                                                <div className="vo-order-info">
                                                    <div className="vo-order-title">{listing.title || "Order item"}</div>
                                                    <div className="small text-muted">Condition: {listing.condition || "N/A"}</div>
                                                    <div className="small text-muted">Qty: {o.quantity}</div>
                                                    <div className="small text-muted">
                                                        Item Price: Rs. {listing.price?.toLocaleString() || "N/A"}
                                                    </div>
                                                </div>

                                                <div className="vo-order-customer compact">
                                                    <div className="vo-mini-heading">Customer</div>
                                                    <div className="small text-muted">{customer.full_name || "Unknown Customer"}</div>
                                                    <div className="small text-muted">{customer.email || "No email"}</div>
                                                    <div className="small text-muted mt-1">
                                                        {o.shipping_address?.address || "No city"}
                                                    </div>
                                                    <div className="small text-muted">{o.shipping_address?.phone || "No phone"}</div>
                                                </div>

                                                <div className="vo-order-side compact">
                                                    <div className="vo-side-line">
                                                        <span className={statusBadgeClass(o.status)}>
                                                            {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                                                        </span>
                                                    </div>

                                                    <div className="vo-side-line">
                                                        <div className="text-muted small">Order Total</div>
                                                        <div className="fw-bold text-success">
                                                            Rs. {o.total.toLocaleString()}
                                                        </div>
                                                    </div>

                                                    <div className="vo-side-line">
                                                        <div className="text-muted small">Update Status</div>
                                                        <select
                                                            className="vo-select vo-status-select"
                                                            value={statusValues[o._id] || o.status}
                                                            onChange={(e) => handleStatusSelect(o._id, e.target.value)}
                                                        >
                                                            {STATUS_OPTIONS.map((status) => (
                                                                <option key={status} value={status}>
                                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <button
                                                        className="vo-update-btn small"
                                                        onClick={() => handleStatusUpdate(o._id)}
                                                        disabled={
                                                            updatingOrderId === o._id ||
                                                            (statusValues[o._id] || o.status) === o.status
                                                        }
                                                    >
                                                        {updatingOrderId === o._id ? "Updating..." : "Update Status"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default VendorOrders;