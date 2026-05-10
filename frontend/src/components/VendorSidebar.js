import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./VendorSidebar.css";

const menuItems = [
  { key: "dashboard", icon: "dashboard", label: "Dashboard", path: "/vendor/dashboard" },
  { key: "list-products", icon: "add_box", label: "Manage Listings", path: "/vendor/list-products" },
  { key: "manage-orders", icon: "inventory_2", label: "Manage Orders", path: "/vendor/orders" },
  { key: "messages", icon: "mail", label: "Message Center", path: "/vendor/messages" },
  { key: "ads", icon: "campaign", label: "Advertisements", path: "/vendor/advertise" },
  { key: "payments", icon: "payments", label: "Payments", path: "/vendor/payments" },
  { key: "subscription-plan", icon: "subscriptions", label: "Subscription Plans", path: "/vendor/subscriptions" },
  { key: "settings", icon: "settings", label: "Profile Settings", path: "/vendor/profile-settings" },
];

const VendorSidebar = ({ vendor }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);

  const logoSrc = vendor?.logo_url || "";
  const displayName = vendor?.business_name || vendor?.full_name || "Vendor";

  useEffect(() => {
    setImageError(false);
  }, [logoSrc]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isActive = (path) => {
    if (path === "/vendor/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="vd-sidebar">
      <div className="vd-user-card">
        {logoSrc && !imageError ? (
          <div className="vd-avatar-wrap">
            <img
              src={logoSrc}
              alt={`${displayName} logo`}
              className="vd-avatar-img"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="vd-avatar">{initials || "V"}</div>
        )}

        <div className="vd-user-name">{displayName}</div>
        <div className="vd-user-email">{vendor?.email}</div>
      </div>

      <nav className="vd-menu">
        {menuItems.map(({ key, icon, label, path }) => (
          <button
            key={key}
            className={`vd-menu-item ${isActive(path) ? "active" : ""}`}
            onClick={() => navigate(path)}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
          </button>
        ))}

        <button className="vd-menu-item logout mt-3" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          <span>Log Out</span>
        </button>
      </nav>
    </aside>
  );
};

export default VendorSidebar;