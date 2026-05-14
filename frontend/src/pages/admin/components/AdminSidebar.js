import React from "react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { key: "dashboard", icon: "dashboard",        label: "Dashboard",           path: "/admin/dashboard" },
  { key: "ads",       icon: "campaign",          label: "Advertisements",     path: "/admin/ads" },
  { key: "inquiries", icon: "mail", label: "User Inquiries", path: "/admin/inquiries" },
  { key: "vendors",   icon: "store",             label: "Vendor Management",  path: "/admin/vendors" },
  { key: "users",     icon: "group",             label: "Users",              path: "/admin/users" },
  { key: "products",  icon: "inventory",         label: "products",           path: "/admin/products" },
  { key: "product-requests",  icon: "Pending_Actions",         label: "Product Requests",           path: "/admin/product-requests" },
  { key: "subscriptions",      icon: "subscriptions",     label: "Subscription Plans",        path: "/admin/subscriptions" },
  { key: "community", icon: "forum", label: "Manage Community", path: "/admin/community" },
  { key: "settings", icon: "settings", label: "Settings", path: "/admin/settings" },
];

const AdminSidebar = ({ activeItem }) => {
  const navigate = useNavigate();

  return (
    <aside className="ad-sidebar position: sticky">
      {/* Label */}
      <div className="ad-sidebar-label">Control Panel</div>

      <nav className="ad-sidebar-menu">
        {menuItems.map(({ key, icon, label, path }) => (
          <button
            key={key}
            className={`ad-sidebar-item ${activeItem === key ? "active" : ""}`}
            onClick={() => path && navigate(path)}
            style={{ opacity: !path ? 0.45 : 1, cursor: !path ? "not-allowed" : "pointer" }}
          >
            <span className="material-symbols-outlined">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
};


export default AdminSidebar;