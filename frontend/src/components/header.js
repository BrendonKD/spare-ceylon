import React from "react";
import "./header.css";
import logo from "../assets/logoSC.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { totalCount, toggleCart } = useCart();

    const isDashboardPage =
        location.pathname.startsWith("/customer/") ||
        location.pathname.startsWith("/vendor/");

    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    const isLoggedIn = !!token;
    const isVendor = userRole === "vendor";

    const logoTarget = isVendor ? "/vendor/dashboard" : "/";

    const handleUserIconClick = () => {
        if (userRole === "customer") {
            navigate("/customer/dashboard");
        } else if (userRole === "vendor") {
            navigate("/vendor/dashboard");
        } else {
            navigate("/login");
        }
    };

    const handleDashboardBack = () => {
        navigate(userRole === "vendor" ? "/vendor/dashboard" : "/customer/dashboard");
    };

    return (
        <header className="sc-header shadow-sm sticky-top bg-white">
            <nav className="navbar navbar-expand-lg">
                <div className="container">
                    <Link to={logoTarget} className="navbar-brand d-flex align-items-center">
                        <img src={logo} alt="Spare Ceylon logo" className="sc-logo-img" />
                    </Link>

                    {!isVendor && (
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
                    )}

                    <div
                        className={`collapse navbar-collapse ${isVendor ? "justify-content-end" : ""}`}
                        id="scMainNavbar"
                    >
                        {!isVendor && (
                            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 sc-nav-links">
                                <li className="nav-item">
                                    <Link className="nav-link" to="/">Home</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/parts">Parts</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/vendors">Vendors</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/community">Community</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/about">About</Link>
                                </li>
                            </ul>
                        )}

                        <div className="d-flex align-items-center gap-2">
                            {isDashboardPage ? (
                                <button
                                    className="btn sc-home-btn"
                                    onClick={handleDashboardBack}
                                >
                                    Back to Dashboard
                                </button>
                            ) : (
                                <>
                                    {!isVendor && (
                                        <>
                                            {isLoggedIn ? (
                                                <button
                                                    className="user-icon-btn"
                                                    onClick={handleUserIconClick}
                                                    title="Go to Dashboard"
                                                    type="button"
                                                >
                                                    <span className="material-symbols-outlined">
                                                        account_circle
                                                    </span>
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn sc-signin-btn"
                                                    onClick={() => navigate("/login")}
                                                    type="button"
                                                >
                                                    Sign In
                                                </button>
                                            )}

                                            <button
                                                className="sc-cart-icon-btn"
                                                type="button"
                                                onClick={toggleCart}
                                                title="View Cart"
                                            >
                                                <span className="material-symbols-outlined">
                                                    shopping_cart
                                                </span>
                                                {totalCount > 0 && (
                                                    <span className="sc-cart-badge">{totalCount}</span>
                                                )}
                                            </button>
                                        </>
                                    )}

                                    {isVendor && (
                                        <button
                                            className="user-icon-btn"
                                            onClick={() => navigate("/vendor/dashboard")}
                                            title="Go to Dashboard"
                                            type="button"
                                        >
                                            <span className="material-symbols-outlined">dashboard</span>
                                        </button>
                                    )}
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