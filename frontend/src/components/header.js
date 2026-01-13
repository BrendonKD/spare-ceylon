import React from "react";
import "./header.css";
import logo from "../assets/logoSC.png";
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
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
              <li className="nav-item">
                <a className="nav-link active" href="/">Home</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/parts">Parts</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/vendors">Vendors</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/community">Community</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/about">About</a>
              </li>
            </ul>

            {/* Action Button */}
            <div className="d-flex">
                <button 
                    className="btn sc-signin-btn w-100-mobile" 
                    onClick={() => navigate('/login')}
                >
                    Sign In
                </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;