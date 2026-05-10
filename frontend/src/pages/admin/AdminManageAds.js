import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/AdminManageAds.css";

import AdminHeader from "../admin/components/AdminHeader";
import AdminSidebar from "../admin/components/AdminSidebar";

const API = "http://localhost:5000";

const AdminManageAds = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [ads, setAds] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        totalPayments: 0,
        pending: 0,
        active: 0,
        rejected: 0,
    });
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [selectedAd, setSelectedAd] = useState(null);

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveStartDate, setApproveStartDate] = useState("");

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectNote, setRejectNote] = useState("");

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const fetchAds = async () => {
        try {
            setLoading(true);
            setMessage("");

            const url = new URLSearchParams({
                status: status === "all" ? "" : status,
            }).toString();

            const res = await axios.get(`${API}/api/ads?${url}`, authConfig);

            const allAds = res.data || [];
            setAds(allAds);

            const totalPayments = allAds
                .filter((ad) => ad.payment_status === "paid")
                .reduce((sum, ad) => sum + Number(ad.payment_amount || 0), 0);

            setStats({
                total: allAds.length,
                totalPayments,
                pending: allAds.filter((ad) => ad.status === "pending").length,
                active: allAds.filter((ad) => ad.status === "active").length,
                rejected: allAds.filter((ad) => ad.status === "rejected").length,
            });
        } catch (error) {
            setMessage(error?.response?.data?.message || "Failed to load ads.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token || localStorage.getItem("role") !== "admin") {
            navigate("/admin/login");
            return;
        }
        fetchAds();
    }, [status, token, navigate]);

    const openApproveModal = (ad) => {
        setSelectedAd(ad);
        setApproveStartDate("");
        setShowRejectModal(false);
        setShowApproveModal(true);
    };

    const closeApproveModal = () => {
        setShowApproveModal(false);
        setSelectedAd(null);
        setApproveStartDate("");
    };

    const handleApproveSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAd) return;

        try {
            await axios.patch(
                `${API}/api/ads/${selectedAd._id}/approve`,
                approveStartDate ? { start_date: approveStartDate } : {},
                authConfig
            );

            setMessage("Ad approved successfully.");
            closeApproveModal();
            fetchAds();
        } catch (error) {
            setMessage(error?.response?.data?.message || "Approval failed.");
        }
    };

    const openRejectModal = (ad) => {
        setSelectedAd(ad);
        setRejectNote("");
        setShowApproveModal(false);
        setShowRejectModal(true);
    };

    const closeRejectModal = () => {
        setShowRejectModal(false);
        setSelectedAd(null);
        setRejectNote("");
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAd) return;

        try {
            await axios.patch(
                `${API}/api/ads/${selectedAd._id}/reject`,
                { admin_note: rejectNote },
                authConfig
            );

            setMessage("Ad rejected.");
            closeRejectModal();
            fetchAds();
        } catch (error) {
            setMessage(error?.response?.data?.message || "Rejection failed.");
        }
    };

    const filteredAds = ads.filter((ad) => {
        const title = ad.title?.toLowerCase() || "";
        const vendor = ad.vendor_id?.full_name?.toLowerCase() || "";
        const keyword = search.toLowerCase();
        return title.includes(keyword) || vendor.includes(keyword);
    });

    return (
        <div className="admin-dashboard">
            <AdminHeader />

            <div className="admin-body">
                <AdminSidebar activeItem="ads" />

                <main className="admin-main">
                    <div className="admin-page-shell">
                        <div className="admin-page-head">
                            <div>
                                <p>Admin Panel</p>
                                <h2>Ad Management</h2>
                                <span>Review, approve and manage vendor ad requests.</span>
                            </div>
                        </div>

                        {message && <div className="admin-alert">{message}</div>}

                        <div className="ads-stats-grid">
                            <div className="ads-stat-card">
                                <div className="ads-stat-top">
                                    <div>
                                        <span>Total Ads</span>
                                        <h3>{stats.total}</h3>
                                    </div>
                                    <span className="material-symbols-outlined ads-stat-icon">campaign</span>
                                </div>
                            </div>

                            <div className="ads-stat-card">
                                <div className="ads-stat-top">
                                    <div>
                                        <span>Total Payments</span>
                                        <h3>LKR {stats.totalPayments.toLocaleString()}</h3>
                                    </div>
                                    <span className="material-symbols-outlined ads-stat-icon">payments</span>
                                </div>
                            </div>

                            <div className="ads-stat-card">
                                <div className="ads-stat-top">
                                    <div>
                                        <span>Pending</span>
                                        <h3>{stats.pending}</h3>
                                    </div>
                                    <span className="material-symbols-outlined ads-stat-icon">schedule</span>
                                </div>
                            </div>

                            <div className="ads-stat-card">
                                <div className="ads-stat-top">
                                    <div>
                                        <span>Active</span>
                                        <h3>{stats.active}</h3>
                                    </div>
                                    <span className="material-symbols-outlined ads-stat-icon">check_circle</span>
                                </div>
                            </div>

                            <div className="ads-stat-card">
                                <div className="ads-stat-top">
                                    <div>
                                        <span>Rejected</span>
                                        <h3>{stats.rejected}</h3>
                                    </div>
                                    <span className="material-symbols-outlined ads-stat-icon">cancel</span>
                                </div>
                            </div>
                        </div>

                        <div className="admin-card">
                            <form
                                className="ads-filter-form"
                                onSubmit={(e) => e.preventDefault()}
                            >
                                <input
                                    type="text"
                                    placeholder="Search by title, vendor..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />

                                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="active">Active</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </form>
                        </div>

                        <div className="admin-card">
                            {loading ? (
                                <p className="table-msg">Loading ads...</p>
                            ) : filteredAds.length === 0 ? (
                                <p className="table-msg">No ads found.</p>
                            ) : (
                                <div className="table-wrap">
                                    <table className="ads-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Vendor</th>
                                                <th>Slot</th>
                                                <th>Days</th>
                                                <th>Cost</th>
                                                <th>Status</th>
                                                <th>Created</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAds.map((ad) => (
                                                <tr key={ad._id}>
                                                    <td>{ad.title}</td>
                                                    <td>{ad.vendor_id?.full_name || "-"}</td>
                                                    <td>
                                                        <span className={`slot-badge ${ad.slot}`}>
                                                            {ad.slot}
                                                        </span>
                                                    </td>
                                                    <td>{ad.duration_days}</td>
                                                    <td>LKR {(ad.duration_days * 500).toLocaleString()}</td>
                                                    <td>
                                                        <span className={`status-badge ${ad.status}`}>
                                                            {ad.status}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(ad.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <div className="action-btns">
                                                            {ad.status === "pending" ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-main small"
                                                                        onClick={() => openApproveModal(ad)}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-outline-danger small"
                                                                        onClick={() => openRejectModal(ad)}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="table-msg">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {showApproveModal && (
                <div className="custom-modal-overlay" onClick={closeApproveModal}>
                    <div
                        className="custom-modal-box"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-head">
                            <h4>Approve Advertisement</h4>
                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={closeApproveModal}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleApproveSubmit}>
                            <div className="custom-modal-body">
                                <p className="modal-text">
                                    You are about to approve <strong>{selectedAd?.title}</strong>.
                                </p>

                                <label className="modal-label">Start Date</label>
                                <input
                                    type="date"
                                    className="modal-date-input"
                                    value={approveStartDate}
                                    onChange={(e) => setApproveStartDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                />

                                <p className="modal-help">
                                    Leave it empty if you want the advertisement to start today.
                                </p>
                            </div>

                            <div className="custom-modal-actions">
                                <button
                                    type="button"
                                    className="btn-outline-secondary small"
                                    onClick={closeApproveModal}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-main small">
                                    Confirm Approval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showRejectModal && (
                <div className="custom-modal-overlay" onClick={closeRejectModal}>
                    <div
                        className="custom-modal-box"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-head">
                            <h4>Reject Advertisement</h4>
                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={closeRejectModal}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleRejectSubmit}>
                            <div className="custom-modal-body">
                                <p className="modal-text">
                                    You are about to reject <strong>{selectedAd?.title}</strong>.
                                </p>

                                <label className="modal-label">Reason / Admin Note</label>
                                <textarea
                                    className="modal-textarea-input"
                                    rows={4}
                                    placeholder="Enter rejection reason..."
                                    value={rejectNote}
                                    onChange={(e) => setRejectNote(e.target.value)}
                                />

                                <p className="modal-help">
                                    This note will be shown to the vendor.
                                </p>
                            </div>

                            <div className="custom-modal-actions">
                                <button
                                    type="button"
                                    className="btn-outline-secondary small"
                                    onClick={closeRejectModal}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-outline-danger small">
                                    Confirm Reject
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManageAds;