import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerSidebar.css";

const menuItems = [
  { key: "dashboard", icon: "dashboard", label: "Dashboard", path: "/customer/dashboard" },
  { key: "garage", icon: "directions_car", label: "My Garage", path: "/customer/garage" },
  { key: "orders", icon: "shopping_bag", label: "Orders", path: "/customer/orders" },
  { key: "messages", icon: "mail", label: "Message Center", path: "/customer/messages" },
  { key: "inquire", icon: "message", label: "Inquire Admin", path: "/customer/inquire" },
  { key: "settings", icon: "settings", label: "Settings", path: "/customer/settings" },
];

const CustomerSidebar = ({
  user = { full_name: "Loading...", email: "...", profile_image: "" },
  handleLogout,
  activeItem = "dashboard"
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [user?.profile_image]);

  const initials = (user?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const showProfileImage = Boolean(user?.profile_image) && !imageError;

  const defaultLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  const onLogout = handleLogout || defaultLogout;

  return (
    <aside className="cd-sidebar">
      <div className="cd-sidebar-user text-center">
        {showProfileImage ? (
          <img
            src={user.profile_image}
            alt={user?.full_name || "User"}
            className="cd-sidebar-avatar-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="cd-sidebar-avatar">{initials}</div>
        )}

        <div className="cd-sidebar-name">{user?.full_name || "Loading..."}</div>
        <div className="cd-sidebar-email">{user?.email || "..."}</div>
      </div>

      <nav className="cd-sidebar-menu">
        {menuItems.map(({ key, icon, label, path }) => (
          <button
            key={key}
            type="button"
            className={`cd-sidebar-item ${activeItem === key ? "active" : ""}`}
            onClick={() => navigate(path)}
          >
            <span className="material-symbols-outlined">{icon}</span>
            {label}
          </button>
        ))}

        <button
          type="button"
          className="cd-sidebar-item cd-sidebar-logout"
          onClick={onLogout}
        >
          <span className="material-symbols-outlined">logout</span>
          Log Out
        </button>
      </nav>
    </aside>
  );
};

export default CustomerSidebar;