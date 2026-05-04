import React from "react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { key: "dashboard",     icon: "dashboard",    label: "Dashboard",       path: "/vendor/dashboard" },
  { key: "list-products", icon: "add_box",      label: "Manage Listings",   path: "/vendor/list-products" },
  { key: "manage-orders", icon: "inventory_2",  label: "Manage Orders",   path: "/vendor/orders" },
  { key: "messages",      icon: "mail",         label: "Message Center",  path: "/vendor/messages" },
  { key: "ads",           icon: "campaign",     label: "Advertisements",  path: "/vendor/advertise" },
  { key: "payments",      icon: "payments",     label: "Payments",        path: "/vendor/payments" },
  { key: "Subscription-plan",      icon: "subscriptions",     label: "Subscription Plans",        path: "/vendor/Subscriptions" },
  { key: "settings",      icon: "settings",     label: "Profile Settings",        path: "/vendor/profile-settings" },
  
];

const VendorSidebar = ({ vendor, activeItem, onLogout }) => {
  const navigate = useNavigate();

  const displayName = vendor?.business_name || vendor?.full_name || "Vendor";

  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="vd-sidebar">
      <div className="vd-user-card">
        <div className="vd-avatar">{initials || "V"}</div>
        <div className="fw-semibold">{displayName}</div>
        <div className="small">{vendor?.email}</div>
      </div>

      <nav className="vd-menu">
        {menuItems.map(({ key, icon, label, path }) => (
          <button
            key={key}
            className={`vd-menu-item ${activeItem === key ? "active" : ""}`}
            onClick={() => path && navigate(path)}
            disabled={!path && activeItem !== key}
            style={{
              opacity: !path ? 0.5 : 1,
              cursor: !path ? "not-allowed" : "pointer"
            }}
          >
            <span className="material-symbols-outlined">{icon}</span>
            {label}
          </button>
        ))}

        <button className="vd-menu-item logout mt-3" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          Log Out
        </button>
      </nav>
    </aside>
  );
};

export default VendorSidebar;