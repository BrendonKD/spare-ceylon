import React from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerSidebar.css";

const menuItems = [
  { key: "dashboard", icon: "dashboard",      label: "Dashboard",      path: "/customer/dashboard" },
  { key: "garage",    icon: "directions_car", label: "My Garage",      path: "/customer/garage" },
  { key: "orders",    icon: "shopping_bag",   label: "Orders",         path: "/customer/orders" },
  { key: "messages",  icon: "mail",           label: "Message Center", path: "/customer/messages" },
  { key: "inquire",  icon: "message",       label: "Inquire Admin",       path: "/customer/inquire" },
  { key: "settings",  icon: "settings",       label: "Settings",       path: "/customer/settings" },
];

const CustomerSidebar = ({ user, handleLogout, activeItem = "dashboard" }) => {
  const navigate = useNavigate();

  // Generate initials from full name
  const initials = (user?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="cd-sidebar">
      {/* User card */}
      <div className="cd-sidebar-user text-center">
        <div className="cd-sidebar-avatar">{initials}</div>
        <div className="cd-sidebar-name">{user?.full_name || "Loading..."}</div>
        <div className="cd-sidebar-email">{user?.email || "..."}</div>
      </div>

      {/* Navigation */}
      <nav className="cd-sidebar-menu">
        {menuItems.map(({ key, icon, label, path }) => (
          <button
            key={key}
            className={`cd-sidebar-item ${activeItem === key ? "active" : ""}`}
            onClick={() => path && navigate(path)}
          >
            <span className="material-symbols-outlined">{icon}</span>
            {label}
          </button>
        ))}

        <button className="cd-sidebar-item cd-sidebar-logout" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          Log Out
        </button>
      </nav>
    </aside>
  );
};

CustomerSidebar.defaultProps = {
  user: { full_name: "Loading...", email: "..." },
  handleLogout: () => {},
  activeItem: "dashboard"
};

export default CustomerSidebar;