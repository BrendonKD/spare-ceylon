import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/logoSC.png";
import "./AdminHeader.css";

const AdminHeader = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="ad-header">
      {/* Logo */}
      <div className="ad-header-brand" onClick={() => navigate("/admin/dashboard")}>
        <img src={logo} alt="Spare Ceylon" className="ad-logo" />
        <span className="ad-admin-pill">Admin</span>
      </div>

      {/* Right side */}
      <div className="ad-header-right">
        
        <button className="ad-logout-btn" onClick={onLogout}>
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;