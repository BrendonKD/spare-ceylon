import React, { useEffect, useState } from "react";
import "./VendorDashboard.css";
import Header from "../components/header";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import VendorSidebar from "../components/VendorSidebar";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState({
    full_name: "Loading...",
    email: "..."
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.role !== "vendor") {
          navigate("/login");
          return;
        }
        setVendor({
          full_name: res.data.full_name,
          email: res.data.email
        });
      } catch (err) {
        console.error("Vendor profile error", err.response?.data || err.message);
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="vendor-dashboard">
      <Header />
      <div className="container-fluid px-0">
        <div className="row g-0">
          <div className="col-12 col-xl-10">
            
            
              <div className="row g-3">
                {/* SIDEBAR */}
                <div className="col-12 col-md-4 col-lg-3">
                    <VendorSidebar
                    vendor={vendor}
                    activeItem="dashboard"
                    onLogout={handleLogout}
                    />
                </div>

                {/* MAIN CONTENT */}
                <div className="col-12 col-md-8 col-lg-9">
                  <main className="vd-main">
                    <div className="mb-4">
                      <h5 className="mb-1">
                        Welcome Back {vendor.full_name}!
                      </h5>
                      <p className="small text-muted mb-0">
                        Here is the summary of your activities...
                      </p>
                    </div>

                    {/* Top summary row */}
                    <div className="row g-3 mb-3">
                      <div className="col-6 col-lg-3">
                        <div className="vd-summary-card">
                          <div className="vd-summary-label">Pending Orders</div>
                          <div className="vd-summary-value">10</div>
                          <span className="vd-summary-dot" />
                        </div>
                      </div>
                      <div className="col-6 col-lg-3">
                        <div className="vd-summary-card">
                          <div className="vd-summary-label">Completed Orders</div>
                          <div className="vd-summary-value">10</div>
                          <span className="vd-summary-dot" />
                        </div>
                      </div>
                      <div className="col-6 col-lg-3">
                        <div className="vd-summary-card">
                          <div className="vd-summary-label">New Messages</div>
                          <div className="vd-summary-value">5</div>
                          <span className="vd-summary-dot" />
                        </div>
                      </div>
                      <div className="col-6 col-lg-3">
                        <div className="vd-summary-card">
                          <div className="vd-summary-label">Payments Received</div>
                          <div className="vd-summary-value">2</div>
                          <span className="vd-summary-dot" />
                        </div>
                      </div>
                    </div>

                    {/* Listed items status block */}
                    <div className="vd-listed-block mb-3">
                      <h6 className="mb-2">Listed Items</h6>
                      <div className="row text-center">
                        <div className="col-4 border-end">
                          <div className="small text-muted">Approved</div>
                          <div className="fw-semibold">5</div>
                        </div>
                        <div className="col-4 border-end">
                          <div className="small text-muted">Pending</div>
                          <div className="fw-semibold">5</div>
                        </div>
                        <div className="col-4">
                          <div className="small text-muted">Rejected</div>
                          <div className="fw-semibold">5</div>
                        </div>
                      </div>
                    </div>

                    {/* Placeholder for charts / upcoming features */}
                    <div className="vd-bottom-row">
                      <div className="vd-info-card">
                        <h6 className="mb-2">Performance Overview</h6>
                        <p className="small text-muted mb-0">
                          Later you can show weekly orders, revenue, or click‑through
                          from advertisements here.
                        </p>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            

          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;