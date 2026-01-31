import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import "./CustomerDashboard.css";
import Header from "../components/header.js";
import Sidebar from "../components/CustomerSidebar.js";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const CustomerDashboard = () => {
    const navigate = useNavigate();
    
    const [user, setUser] = useState({
        full_name: "Loading...",
        email: "..."
    });

    // 1. Define handleLogout first and wrap in useCallback
    // This prevents the "use-before-define" error and the dependency loop
    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    }, [navigate]);

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
                const response = await axios.get("http://localhost:5000/api/auth/profile", {
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
    }, [navigate, handleLogout]); // handleLogout is now stable

    return (
        <div className="customer-dashboard">
            <Header />
            <div className="container-fluid px-0"> 
                <div className="row g-0"> 
                    <div className="col-12 col-md-3 col-lg-2">
                        <Sidebar user={user} handleLogout={handleLogout} />
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="col-12 col-md-9 col-lg-10 p-4">
                        <main>
                            <div className="mb-4">
                                <h5 className="mb-1">Welcome Back {user.full_name} !</h5>
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
                                {/* ORDER LIST */}
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