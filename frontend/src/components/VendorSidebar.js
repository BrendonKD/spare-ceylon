import React from "react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { key: "dashboard",      icon: "dashboard",    label: "Dashboard",          path: "/vendor/dashboard" },
  { key: "list-products",  icon: "add_box",       label: "List Products",      path: "/vendor/list-products" },
  { key: "manage-orders",  icon: "inventory_2",   label: "Manage Orders",      path: null },
  { key: "messages",       icon: "mail",          label: "Message Center",     path: null },
  { key: "ads",            icon: "campaign",      label: "Advertisements",     path: "/vendor/advertise" },
  { key: "payments",       icon: "payments",      label: "Payments",           path: null },
  { key: "settings",       icon: "settings",      label: "Settings",           path: null },
];

const VendorSidebar = ({ vendor, activeItem, onLogout }) => {
  const navigate = useNavigate();

  // Generate initials from full name for the avatar
  const initials = vendor.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="vd-sidebar">
      {/* User card */}
      <div className="vd-user-card">
        <div className="vd-avatar">{initials !== "L." ? initials : "V"}</div>
        <div className="fw-semibold">{vendor.full_name}</div>
        <div className="small">{vendor.email}</div>
      </div>

      {/* Navigation */}
      <nav className="vd-menu">
        {menuItems.map(({ key, icon, label, path }) => (
          <button
            key={key}
            className={`vd-menu-item ${activeItem === key ? "active" : ""}`}
            onClick={() => path && navigate(path)}
            disabled={!path && activeItem !== key}
            style={{ opacity: !path ? 0.5 : 1, cursor: !path ? "not-allowed" : "pointer" }}
          >
            <span className="material-symbols-outlined">{icon}</span>
            {label}
          </button>
        ))}

        <button className="vd-menu-item logout mt-3" onClick={onLogout}>
          <span className="material-symbols-outlined">logout</span>
          Log Out
        </button>
      </nav>
    </aside>
  );
};

export default VendorSidebar;