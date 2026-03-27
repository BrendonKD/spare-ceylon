import React, { useEffect, useState } from "react";
import "./CustomerGarage.css";
import Header from "../components/header";
import CustomerSidebar from "../components/CustomerSidebar.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CustomerGarage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [user, setCustomer] = useState({
    full_name: "Loading...",
    email: "..."
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    vehicle_no: "",
    fuel_type: "Petrol",
    engine_capacity: "",
    mileage: "",
    image_file: null
  });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

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
        setCustomer({
          full_name: res.data.full_name,
          email: res.data.email
        });
      } catch (err) {
        console.error("Profile error", err);
      }
    };

    fetchProfile();

const fetchVehicles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/garage", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(res.data);
    } catch (err) {
      console.error("Error loading garage", err.response?.data || err.message);
      if (err.response && err.response.status === 401) {
        navigate("/login");
      }
    }
  };
  fetchVehicles();
  },

  [navigate, token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    setForm((prev) => ({ ...prev, image_file: file }));
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("make", form.make);
    formData.append("model", form.model);
    formData.append("year", form.year);
    formData.append("vehicle_no", form.vehicle_no);
    formData.append("fuel_type", form.fuel_type);
    formData.append("engine_capacity", form.engine_capacity);
    formData.append("mileage", form.mileage);

    // Only append if a file exists
    if (form.image_file) {
      formData.append("image", form.image_file);
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/garage",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setVehicles((prev) => [res.data, ...prev]);
      setShowForm(false);
      setForm({
        make: "",
        model: "",
        year: "",
        vehicle_no: "",
        fuel_type: "Petrol",
        engine_capacity: "",
        mileage: "",
        image_file: null
      });
    } catch (err) {
      console.error("Error adding vehicle", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this vehicle from your garage?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/garage/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      console.error("Error deleting vehicle", err.response?.data || err.message);
    }
  };

  const handleViewHistory = (id) => {
    alert("History view not implemented yet. Vehicle ID: " + id);
  };

return (
  <div className="customer-dashboard">
    <Header />
    <div className="cd-layout"> 
      
        {/* SIDEBAR */}
        <div className="col-lg-3 col-xl-2 pe-0">
          <CustomerSidebar
             user={user}  
            activeItem="garage"
            onLogout={handleLogout}
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="col-lg-9 col-xl-10 ps-3"> 
          <main className="customer-garage-main">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">My Garage</h5>
              <button
                className="add-vehicle-btn"
                onClick={() => setShowForm((s) => !s)}
              >
                + Add Vehicle
              </button>
            </div>
            <p className="small text-muted mb-3">
              Manage your vehicles and quickly find the best parts for each one.
            </p>

            {showForm && (
              <div className="garage-form-card mb-4">
                <form onSubmit={handleAddVehicle}>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small">Make</label>
                      <input
                        name="make"
                        placeholder="Toyota"
                        className="form-control form-control-sm"
                        value={form.make}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small">Model</label>
                      <input
                        name="model"
                        placeholder="CHR"
                        className="form-control form-control-sm"
                        value={form.model}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-6 col-md-2">
                      <label className="form-label small">Year</label>
                      <input
                        name="year"
                        type="number"
                        placeholder="2024"
                        className="form-control form-control-sm"
                        value={form.year}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-6 col-md-2">
                      <label className="form-label small">Vehicle No.</label>
                      <input
                        name="vehicle_no"
                        placeholder="WP CBF-6428"
                        className="form-control form-control-sm"
                        value={form.vehicle_no}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small">Fuel Type</label>
                      <select
                        name="fuel_type"
                        className="form-select form-select-sm"
                        value={form.fuel_type}
                        onChange={handleChange}
                      >
                        <option>Petrol</option>
                        <option>Diesel</option>
                        <option>Hybrid</option>
                        <option>Electric</option>
                      </select>
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small">Engine Capacity</label>
                      <input
                        name="engine_capacity"
                        placeholder="1500cc"
                        className="form-control form-control-sm"
                        value={form.engine_capacity}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small">Mileage</label>
                      <input
                        name="mileage"
                        placeholder="25000km"
                        className="form-control form-control-sm"
                        value={form.mileage}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label small">Vehicle Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary me-2"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Vehicle"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Vehicle cards */}
            <div className="row g-4">
              {vehicles.map((v) => (
                <div className="col-12 col-md-6 col-lg-6" key={v._id}>
                  <div className="garage-vehicle-card h-100">
                    <div className="vehicle-image-wrapper">
                      <div
                        className="vehicle-image"
                        style={{
                          backgroundImage: `url(${
                            v.image_url 
                              ? `http://localhost:5000/${v.image_url}`
                              : "https://images.pexels.com/photos/4488630/pexels-photo-4488630.jpeg"
                          })`
                        }}
                      />
                    </div>
                    <div className="vehicle-info p-3">
                      <h6 className="text-center mb-2">
                        {v.make} {v.model} {v.year}
                      </h6>
                      <div className="d-flex justify-content-between small">
                        <div>
                          <div className="text-muted">Vehicle No.</div>
                          <div>{v.vehicle_no}</div>
                        </div>
                        <div>
                          <div className="text-muted">Fuel Type</div>
                          <div>{v.fuel_type}</div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between small mt-2">
                        <div>
                          <div className="text-muted">Engine Capacity</div>
                          <div>{v.engine_capacity}</div>
                        </div>
                        <div>
                          <div className="text-muted">Mileage</div>
                          <div>{v.mileage}</div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <button
                          className="btn btn-sm view-history-btn"
                          onClick={() => handleViewHistory(v._id)}
                        >
                          View History
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(v._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <div className="col-12">
                  <div className="text-muted small">
                    No vehicles added yet. Click "Add Vehicle" to create your first entry.
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      
    </div>
  </div>
);

};

export default CustomerGarage;
