import React from "react";
import { useNavigate } from 'react-router-dom';
import "./VendorSidebar.css";

const VendorSidebar = ({ vendor, activeItem, onLogout }) => {
  const navigate = useNavigate();
  return (
    <aside className="vd-sidebar">
      <div className="vd-user-card text-center mb-3">
        <div className="vd-avatar mx-auto mb-2" />
        <div className="fw-semibold">{vendor.full_name}</div>
        <div className="small text-muted">{vendor.email}</div>
      </div>

      <nav className="vd-menu">
        <button
          className={`vd-menu-item ${activeItem === "dashboard" ? "active" : ""}`}
          onClick={() => navigate("/vendor/dashboard")}  
        >
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </button>

        <button
          className={`vd-menu-item ${activeItem === "list-products" ? "active" : ""}`}
          onClick={() => navigate("/vendor/list-products")}  
        >
          <span className="material-symbols-outlined">add_box</span>
          List Products
        </button>


        <button
          className={`vd-menu-item ${activeItem === "manage-orders" ? "active" : ""}`}
        >
          <span className="material-symbols-outlined">inventory_2</span>
          Manage Orders
        </button>

        <button
          className={`vd-menu-item ${activeItem === "messages" ? "active" : ""}`}
        >
          <span className="material-symbols-outlined">mail</span>
          Message Center
        </button>

        <button
          className={`vd-menu-item ${activeItem === "ads" ? "active" : ""}`}
        >
          <span className="material-symbols-outlined">campaign</span>
          Advertisements Corner
        </button>

        <button
          className={`vd-menu-item ${activeItem === "payments" ? "active" : ""}`}
        >
          <span className="material-symbols-outlined">payments</span>
          Customer Payments
        </button>

        <button
          className={`vd-menu-item ${activeItem === "settings" ? "active" : ""}`}
        >
          <span className="material-symbols-outlined">settings</span>
          Settings
        </button>

        <button className="vd-menu-item logout mt-3" onClick={onLogout}>
          <span className="material-symbols-outlined">logout</span>
          Log Out
        </button>
      </nav>
    </aside>
  );
};

export default VendorSidebar;
