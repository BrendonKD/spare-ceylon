import React, { useState, useEffect } from "react";
import "./CustomerDashboard.css";
import Header from "../components/header.js";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const CustomerDashboard = () => {
    const navigate = useNavigate();
    
    const [user, setUser] = useState({
        name: "Loading...",
        email: "..."
    });

    // 2. Fetch data from database on load
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                // Call backend API
                const response = await axios.get("http://localhost:5000/api/user/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                    });

                    setUser({
                    full_name: response.data.full_name,
                    email: response.data.email
                    });

            } catch (error) {
                console.error("Error fetching user data", error);
                // If the token is expired/invalid, logout
                if (error.response && error.response.status === 401) {
                    handleLogout();
                }
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    };

    return (
        <div className="customer-dashboard">
            <Header />
            <div className="container-fluid px-0"> 
                <div className="row g-0"> 
                    
                    {/* LEFT SIDEBAR */}
                    <div className="col-12 col-md-3 col-lg-2">
                        <aside className="dash-sidebar">
                            <div className="dash-user-card text-center mb-3">
                                <div className="dash-avatar mx-auto mb-2" />
                                <div className="fw-semibold">{user.full_name}</div>
                                <div className="small text-muted">{user.email}</div>
                            </div>

                            <nav className="dash-menu">
                                <button className="dash-menu-item active">
                                    <span className="material-symbols-outlined">dashboard</span>
                                    Dashboard
                                </button>
                                <button className="dash-menu-item">
                                    <span className="material-symbols-outlined ">directions_car</span>
                                    My Garage
                                </button>
                                <button className="dash-menu-item">
                                    <span className="material-symbols-outlined">shopping_bag</span>
                                    Orders
                                </button>
                                <button className="dash-menu-item">
                                    <span className="material-symbols-outlined">mail</span>
                                    Message Center
                                </button>
                                <button className="dash-menu-item">
                                    <span className="material-symbols-outlined">settings</span>
                                    Settings
                                </button>

                                <button 
                                    className="dash-menu-item logout mt-3"
                                    onClick={handleLogout}
                                >
                                    <span className="material-symbols-outlined">logout</span>
                                    Log Out
                                </button>
                            </nav>
                        </aside>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="col-12 col-md-9 col-lg-10 p-4">
                        <main>
                            <div className="mb-4">
                                <h5 className="mb-1">Welcome Back {user.name} !</h5>
                                <p className="small text-muted mb-0">Here is the summary of your activities...</p>
                            </div>

                            {/* Summary Cards */}
                            <div className="row g-3 mb-4">
                                <div className="col-6 col-lg-3">
                                    <div className="summary-card">
                                        <div className="summary-label">Total Orders</div>
                                        <div className="summary-value">10</div>
                                        <span className="material-symbols-outlined summary-icon summary-dot">local_shipping</span>
                                    </div>
                                </div>
                                <div className="col-6 col-lg-3">
                                    <div className="summary-card">
                                        <div className="summary-label">Wishlist Items</div>
                                        <div className="summary-value">5</div>
                                        <span className="material-symbols-outlined summary-icon summary-dot">favorite</span>
                                    </div>
                                </div>
                                <div className="col-6 col-lg-3">
                                    <div className="summary-card">
                                        <div className="summary-label">Saved Vendors</div>
                                        <div className="summary-value">5</div>
                                        <span className="material-symbols-outlined summary-icon summary-dot">storefront</span>
                                    </div>
                                </div>
                                <div className="col-6 col-lg-3">
                                    <div className="summary-card">
                                        <div className="summary-label">My Vehicles</div>
                                        <div className="summary-value">2</div>
                                        <span className="material-symbols-outlined summary-icon summary-dot">directions_car</span>
                                    </div>
                                </div>
                            </div>

                            <div className="row g-4">
                                {/* ORDER LISTn */}
                                <div className="col-12 col-xl-8">
                                    <div className="order-list">
                                        {[1, 2, 3].map((o) => (
                                            <div className="order-card mb-3" key={o}>
                                                <div className="order-main">
                                                    <div className="small text-muted">Order ID : #050{o}</div>
                                                    <div className="small">Order Status : Out for delivery</div>
                                                    <div className="small">Order Date : 10 / 11 / 2025</div>
                                                    <div className="small">Description : Nissan Caravan Break Light</div>
                                                </div>
                                                <div className="order-side text-end">
                                                    <div className="small fw-semibold mb-2">Total : Rs. 1000.00</div>
                                                    <button className="btn-sm order-details-btn">Order Details</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* PROMO CARD */}
                                <div className="col-12 col-xl-4">
                                    <div className="promo-help-card h-100 d-flex flex-column justify-content-between">
                                        <div>
                                            <h6 className="mb-2 text-white">Need Help Finding Parts?</h6>
                                            <p className="small text-light mb-4">
                                                Use our AI‑powered search to find the exact parts you need for your vehicle.
                                            </p>
                                        </div>
                                        <button className="btn btn-light btn-sm">Start Searching</button>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;