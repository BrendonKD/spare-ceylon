import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./CustomerSidebar.css";

const CustomerSidebar = ({ user, handleLogout, activeItem = "dashboard" }) => {
    const navigate = useNavigate();

    return (
        <aside className="dash-sidebar">
            <div className="dash-user-card text-center mb-3">
                <div className="dash-avatar mx-auto mb-2" />
                <div className="fw-semibold">{user ? user.full_name : "Loading..."}</div>
                <div className="small text-muted">{user ? user.email : "..."}</div>
            </div>

            <nav className="dash-menu">
                <button 
                    className={`dash-menu-item ${activeItem === "dashboard" ? "active" : ""}`} 
                    onClick={() => navigate("/customer/dashboard")}
                >
                    <span className="material-symbols-outlined">dashboard</span>
                    Dashboard
                </button>
                <button
                    className={`dash-menu-item ${activeItem === "garage" ? "active" : ""}`}
                    onClick={() => navigate("/customer/garage")}
                >
                    <span className="material-symbols-outlined">directions_car</span>
                    My Garage
                </button>
                <button 
                    className={`dash-menu-item ${activeItem === "orders" ? "active" : ""}`}
                    onClick={() => navigate("/customer/orders")}
                >
                    <span className="material-symbols-outlined">shopping_bag</span>
                    Orders
                </button>
                <button 
                    className={`dash-menu-item ${activeItem === "messages" ? "active" : ""}`}
                    onClick={() => navigate("/customer/messages")}
                >
                    <span className="material-symbols-outlined">mail</span>
                    Message Center
                </button>
                <button 
                    className={`dash-menu-item ${activeItem === "settings" ? "active" : ""}`}
                    onClick={() => navigate("/customer/settings")}
                >
                    <span className="material-symbols-outlined">settings</span>
                    Settings
                </button>

                <button 
                    className="dash-menu-item logout mt-3"
                    onClick={handleLogout}
                >
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
