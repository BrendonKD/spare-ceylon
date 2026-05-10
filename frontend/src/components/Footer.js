import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="sc-footer">
            <div className="sc-footer-container">
                <div className="sc-footer-top">
                    <div className="sc-footer-brand">
                        <div className="sc-footer-brand-head">
                            <div>
                                <h3 className="sc-footer-logo">Spare Ceylon</h3>
                                <p className="sc-footer-tag">Automotive parts marketplace in Sri Lanka</p>
                            </div>
                        </div>

                        <p className="sc-footer-text">
                            Find trusted spare parts, connect with verified vendors, and manage
                            orders through one reliable marketplace built for customers and sellers.
                        </p>

                        <div className="sc-footer-contact">
                            <div className="sc-footer-contact-item">
                                <span className="material-symbols-outlined">location_on</span>
                                <span>Avissawella, Sri Lanka</span>
                            </div>

                            <div className="sc-footer-contact-item">
                                <span className="material-symbols-outlined">mail</span>
                                <span>spareceylon@gmail.com</span>
                            </div>
                        </div>
                    </div>

                    <div className="sc-footer-links">
                        <div className="sc-footer-col">
                            <h4>Explore</h4>
                            <Link to="/">Home</Link>
                            <Link to="/parts">Browse Parts</Link>
                            <Link to="/vendors">Vendors</Link>
                            <Link to="/community">Community</Link>
                            <Link to="/about">About Us</Link>
                        </div>

                        <div className="sc-footer-col">
                            <h4>Customer</h4>
                            <Link to="/register/customer">Create Account</Link>
                            <Link to="/login">Login</Link>
                            <Link to="/customer/garage">My Garage</Link>
                            <Link to="/customer/orders">Orders</Link>
                            <Link to="/customer/messages">Messages</Link>
                        </div>

                        <div className="sc-footer-col">
                            <h4>Vendor</h4>
                            <Link to="/register/vendor">Become a Vendor</Link>
                        </div>

                        <div className="sc-footer-col">
                            <h4>Support</h4>
                            <Link to="/customer/inquire">Contact Admin</Link>
                            <Link to="/forgot-password">Forgot Password</Link>
                            <Link to="/admin/login">Admin Login</Link>

                            <a href="mailto:spareceylon@gmail.com">Email Us</a>
                        </div>
                    </div>
                </div>

                <div className="sc-footer-divider" />

                <div className="sc-footer-bottom">
                    <p>© {year} Spare Ceylon. All rights reserved.</p>

                    <Link to="/admin/login" className="sc-footer-admin-link">
                        <span className="material-symbols-outlined">admin_panel_settings</span>
                        Admin Login
                    </Link>

                    <div className="sc-footer-bottom-links">
                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="sc-footer-social"
                        >
                            <FaFacebookF />
                        </a>

                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="sc-footer-social"
                        >
                            <FaInstagram />
                        </a>

                        <a
                            href="https://youtube.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="YouTube"
                            className="sc-footer-social"
                        >
                            <FaYoutube />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;