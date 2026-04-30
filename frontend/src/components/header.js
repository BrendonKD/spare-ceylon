import React from "react";
import "./header.css";
import logo from "../assets/logoSC.png";
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from "../context/CartContext";

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { totalCount, toggleCart } = useCart();

    // 1. Logic to check if we are on a dashboard page (to show "Back to Home")
    const isDashboardPage =
        location.pathname.startsWith("/customer/") ||
        location.pathname.startsWith("/vendor/");

    // 2. Logic to check if user is logged in (to show User Icon)
    const isLoggedIn = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    // Function to handle icon click
    const handleUserIconClick = () => {
        if (userRole === "customer") {
            navigate("/customer/dashboard");
        } else if (userRole === "vendor") {
            navigate("/vendor/dashboard");
        } else {
            navigate("/login");
        }
    };

    return (
        <header className="sc-header shadow-sm sticky-top bg-white">
            <nav className="navbar navbar-expand-lg">
                <div className="container">
                    {/* Logo */}
                    <a className="navbar-brand d-flex align-items-center" href="/">
                        <img src={logo} alt="Spare Ceylon logo" className="sc-logo-img" />
                    </a>

                    {/* Hamburger Toggler */}
                    <button
                        className="navbar-toggler border-0"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#scMainNavbar"
                        aria-controls="scMainNavbar"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* Collapsible Content */}
                    <div className="collapse navbar-collapse" id="scMainNavbar">
                        <ul className="navbar-nav mx-auto mb-2 mb-lg-0 sc-nav-links">
                            <li className="nav-item"><a className="nav-link" href="/">Home</a></li>
                            <li className="nav-item"><a className="nav-link" href="/parts">Parts</a></li>
                            <li className="nav-item"><a className="nav-link" href="/vendors">Vendors</a></li>
                            <li className="nav-item"><a className="nav-link" href="/community">Community</a></li>
                            <li className="nav-item"><a className="nav-link" href="/about">About</a></li>
                            <li className="nav-item"><a className="nav-link" href="/inqueries">Inqiries</a></li>
                        </ul>

                        {/* Action Section: This is where the logic combines */}
                        <div className="d-flex align-items-center gap-2">
                            {isDashboardPage ? (
                                <button
                                    className="btn sc-home-btn"
                                    onClick={() => navigate("/")}
                                >
                                    Back to Home
                                </button>
                            ) : (
                                <>
                                    {/* user / sign-in */}
                                    {isLoggedIn ? (
                                        <button
                                            className="user-icon-btn"
                                            onClick={handleUserIconClick}
                                            title="Go to Dashboard"
                                        >
                                            <span className="material-symbols-outlined">account_circle</span>
                                        </button>
                                    ) : (
                                        <button
                                            className="btn sc-signin-btn"
                                            onClick={() => navigate("/login")}
                                        >
                                            Sign In
                                        </button>
                                    )}

                                    {/* cart icon */}
                                    <button
                                        className="sc-cart-icon-btn"
                                        type="button"
                                        onClick={toggleCart}
                                        title="View Cart"
                                    >
                                        <span className="material-symbols-outlined">shopping_cart</span>
                                        {totalCount > 0 && (
                                            <span className="sc-cart-badge">{totalCount}</span>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;