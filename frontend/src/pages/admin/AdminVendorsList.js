import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/AdminVendorsList.css";
import AdminHeader from "../admin/components/AdminHeader";
import AdminSidebar from "../admin/components/AdminSidebar";

const API = "http://localhost:5000/api/admin/vendors";

const AdminVendorsList = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [vendors, setVendors] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
    });
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const fetchVendors = async () => {
        try {
            setLoading(true);
            setMessage("");

            const res = await axios.get(
                `${API}?search=${encodeURIComponent(search)}&status=${status}`,
                authConfig
            );

            setVendors(res.data.vendors || []);
            setStats(
                res.data.stats || {
                    total: 0,
                    pending: 0,
                    verified: 0,
                    rejected: 0,
                }
            );
        } catch (error) {
            setMessage(error?.response?.data?.message || "Failed to load vendors.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, [status]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchVendors();
    };

    const handleDelete = async (vendorId) => {
        const ok = window.confirm("Delete this vendor permanently?");
        if (!ok) return;

        try {
            await axios.delete(`${API}/${vendorId}`, authConfig);
            setMessage("Vendor deleted successfully.");
            fetchVendors();
        } catch (error) {
            setMessage(error?.response?.data?.message || "Failed to delete vendor.");
        }
    };

    return (
        <div className="admin-dashboard">
            <AdminHeader />

            <div className="admin-body">
                <AdminSidebar activeItem="vendors" />

                <main className="admin-main">
                    <div className="admin-page-shell">
                        <div className="admin-page-head">
                            <div>
                                <p>Admin Panel</p>
                                <h2>Vendor Management</h2>
                                <span>Review, verify and manage all registered vendors.</span>
                            </div>
                        </div>

                        {message && <div className="admin-alert">{message}</div>}

                        <div className="vendor-stats-grid">
                            <div className="vendor-stat-card">
                                <span>Total Vendors</span>
                                <h3>{stats.total}</h3>
                            </div>
                            <div className="vendor-stat-card">
                                <span>Pending</span>
                                <h3>{stats.pending}</h3>
                            </div>
                            <div className="vendor-stat-card">
                                <span>Verified</span>
                                <h3>{stats.verified}</h3>
                            </div>
                            <div className="vendor-stat-card">
                                <span>Rejected</span>
                                <h3>{stats.rejected}</h3>
                            </div>
                        </div>

                        <div className="admin-card">
                            <form onSubmit={handleSearch} className="vendor-filter-form">
                                <input
                                    type="text"
                                    placeholder="Search by business, owner, email, reg no..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />

                                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="verified">Verified</option>
                                    <option value="rejected">Rejected</option>
                                </select>

                                <button type="submit" className="btn-main">Filter</button>
                            </form>
                        </div>

                        <div className="admin-card">
                            {loading ? (
                                <p className="table-msg">Loading vendors...</p>
                            ) : vendors.length === 0 ? (
                                <p className="table-msg">No vendors found.</p>
                            ) : (
                                <div className="table-wrap">
                                    <table className="vendors-table">
                                        <thead>
                                            <tr>
                                                <th>Business</th>
                                                <th>Owner</th>
                                                <th>Email</th>
                                                <th>Registration No</th>
                                                <th>Status</th>
                                                <th>Created</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vendors.map((vendor) => (
                                                <tr key={vendor._id}>
                                                    <td>{vendor.business_name}</td>
                                                    <td>{vendor.vendor_id?.full_name || "-"}</td>
                                                    <td>{vendor.vendor_id?.email || "-"}</td>
                                                    <td>{vendor.business_reg_no}</td>
                                                    <td>
                                                        <span className={`status-badge ${vendor.verification_status}`}>
                                                            {vendor.verification_status}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <div className="action-btns">
                                                            <button
                                                                type="button"
                                                                className="btn-main small"
                                                                onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                                                            >
                                                                View & Verify
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-outline-danger small"
                                                                onClick={() => handleDelete(vendor._id)}
                                                            >
                                                                Delete
                                                            </button>
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
        </div>
    );
};

export default AdminVendorsList;