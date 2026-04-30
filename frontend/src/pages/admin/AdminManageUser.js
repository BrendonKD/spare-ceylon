import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminSidebar from "../admin/components/AdminSidebar";
import AdminHeader from "../admin/components/AdminHeader";
import "./AdminManageUser.css";

const API = "http://localhost:5000";

const AdminManageUser = () => {
    const [admin, setAdmin] = useState({
        full_name: "Loading...",
        email: "...",
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [deletingUserId, setDeletingUserId] = useState(null);
    const [roleFilter, setRoleFilter] = useState("all");

    useEffect(() => {
        const fetchPageData = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    window.location.href = "/admin/login";
                    return;
                }

                const [profileRes, usersRes] = await Promise.all([
                    axios.get(`${API}/api/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${API}/api/auth/users`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (profileRes.data.role !== "admin") {
                    window.location.href = "/admin/login";
                    return;
                }

                setAdmin({
                    full_name: profileRes.data.full_name,
                    email: profileRes.data.email,
                });

                setUsers(usersRes.data || []);
            } catch (err) {
                console.error("Error loading admin users page", err);
                alert(err.response?.data?.message || "Failed to load users");
            } finally {
                setLoading(false);
            }
        };

        fetchPageData();
    }, []);

    const filteredUsers = useMemo(() => {
        let result = [...users];
        const query = searchTerm.trim().toLowerCase();

        if (query) {
            result = result.filter((user) =>
                [user.full_name, user.email, user.phone, user.role, user.status]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(query))
            );
        }

        if (roleFilter !== "all") {
            result = result.filter((user) => user.role === roleFilter);
        }

        return result;
    }, [users, searchTerm, roleFilter]);

    const adminUsers = useMemo(
        () => filteredUsers.filter((user) => user.role === "admin"),
        [filteredUsers]
    );
    const vendorUsers = useMemo(
        () => filteredUsers.filter((user) => user.role === "vendor"),
        [filteredUsers]
    );
    const customerUsers = useMemo(
        () => filteredUsers.filter((user) => user.role === "customer"),
        [filteredUsers]
    );

    const totalUsers = users.length;
    const totalAdmins = users.filter((user) => user.role === "admin").length;
    const totalVendors = users.filter((user) => user.role === "vendor").length;
    const totalCustomers = users.filter((user) => user.role === "customer").length;

    const statusBadgeClass = (status) =>
        status === "active" ? "amu-badge active" : "amu-badge inactive";

    const roleBadgeClass = (role) => `amu-role-badge ${role || ""}`;

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem("token");
            const nextStatus = currentStatus === "active" ? "inactive" : "active";

            setUpdatingUserId(userId);

            const res = await axios.patch(
                `${API}/api/auth/users/${userId}/status`,
                { status: nextStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedUser = res.data.user;
            setUsers((prev) =>
                prev.map((user) => (user._id === userId ? updatedUser : user))
            );
        } catch (err) {
            console.error("Failed to update user status", err);
            alert(err.response?.data?.message || "Failed to update user status");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            const token = localStorage.getItem("token");
            setDeletingUserId(userId);

            await axios.delete(`${API}/api/auth/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUsers((prev) => prev.filter((user) => user._id !== userId));
        } catch (err) {
            console.error("Failed to delete user", err);
            alert(err.response?.data?.message || "Failed to delete user");
        } finally {
            setDeletingUserId(null);
        }
    };

    const renderRoleBox = (title, icon, list, emptyText) => (
        <section className="amu-role-box">
            <div className="amu-role-box-head">
                <div className="amu-role-box-title">
                    <span className="material-symbols-outlined">{icon}</span>
                    <div>
                        <h3>{title}</h3>
                        <p>{list.length} users</p>
                    </div>
                </div>
            </div>

            {list.length === 0 ? (
                <div className="amu-empty-state">{emptyText}</div>
            ) : (
                <div className="amu-mini-list">
                    {list.map((user) => (
                        <div className="amu-mini-row" key={user._id}>
                            <div className="amu-mini-left">
                                <div className="amu-avatar">
                                    {(user.full_name || "U").charAt(0).toUpperCase()}
                                </div>
                                <div className="amu-mini-text">
                                    <h4>{user.full_name || "Unknown User"}</h4>
                                    <p>{user.email || "No email"}</p>
                                </div>
                            </div>

                            <div className="amu-mini-meta">
                                <span className={roleBadgeClass(user.role)}>{user.role}</span>
                                <span className={statusBadgeClass(user.status || "active")}>
                                    {user.status || "active"}
                                </span>
                                <span className="amu-phone">
                                    {user.phone || "No phone"}
                                </span>
                            </div>

                            <div className="amu-mini-actions">
                                <button
                                    className={`amu-action-btn ${user.status === "active" ? "inactive-btn" : "active-btn"
                                        }`}
                                    onClick={() => handleToggleStatus(user._id, user.status)}
                                    disabled={updatingUserId === user._id}
                                >

                                    {updatingUserId === user._id
                                        ? "Updating..."
                                        : user.status === "active"
                                            ? "Deactivate"
                                            : "Activate"}
                                </button>

                                <button
                                    className="amu-action-btn delete-btn"
                                    onClick={() => handleDeleteUser(user._id)}
                                    disabled={deletingUserId === user._id}
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                    {deletingUserId === user._id ? "Deleting..." : ""}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );

    return (
        <div className="admin-dashboard">
            <AdminHeader admin={admin} />

            <div className="admin-layout">
                <AdminSidebar activeItem="users" />

                <main className="admin-main amu-main">
                    <div className="amu-page-header">
                        <h2 className="amu-page-title">Manage Users</h2>
                        <p className="amu-page-subtitle">
                            View admins, vendors, and customers in separate sections.
                        </p>
                    </div>

                    <div className="amu-stats-grid">
                        <div className="amu-stat-card">
                            <span>Total Users</span>
                            <h3>{totalUsers}</h3>
                        </div>
                        <div className="amu-stat-card">
                            <span>Admins</span>
                            <h3>{totalAdmins}</h3>
                        </div>
                        <div className="amu-stat-card">
                            <span>Vendors</span>
                            <h3>{totalVendors}</h3>
                        </div>
                        <div className="amu-stat-card">
                            <span>Customers</span>
                            <h3>{totalCustomers}</h3>
                        </div>
                    </div>

                    <div className="amu-toolbar">
                        <div className="amu-toolbar-inner">
                            <div className="amu-search-box">
                                <span className="material-symbols-outlined">search</span>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <select
                                className="amu-filter-select"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="all">All Users</option>
                                <option value="admin">Admins</option>
                                <option value="vendor">Vendors</option>
                                <option value="customer">Customers</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="amu-loading-wrap">
                            <div className="spinner-border text-danger" role="status" />
                        </div>
                    ) : roleFilter === "admin" ? (
                        renderRoleBox("Admins", "admin_panel_settings", adminUsers, "No admin users found.")
                    ) : roleFilter === "vendor" ? (
                        renderRoleBox("Vendors", "storefront", vendorUsers, "No vendor users found.")
                    ) : roleFilter === "customer" ? (
                        renderRoleBox("Customers", "group", customerUsers, "No customer users found.")
                    ) : (
                        <div className="amu-role-grid">
                            {renderRoleBox("Admins", "admin_panel_settings", adminUsers, "No admin users found.")}
                            {renderRoleBox("Vendors", "storefront", vendorUsers, "No vendor users found.")}
                            {renderRoleBox("Customers", "group", customerUsers, "No customer users found.")}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminManageUser;