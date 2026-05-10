import React, { useEffect, useMemo, useState } from "react";
import "./styles/CustomerGarage.css";
import Header from "../components/header";
import CustomerSidebar from "../components/CustomerSidebar.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

// Empty vehicle form so we can reset cleanly after submit
const emptyVehicleForm = {
  make: "",
  model: "",
  year: "",
  vehicle_no: "",
  fuel_type: "Petrol",
  engine_capacity: "",
  mileage: "",
  image_file: null
};

// Empty service form for each vehicle
const emptyServiceForm = {
  service_type: "",
  service_date: "",
  mileage_at_service: "",
  notes: ""
};

const CustomerGarage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [vehicles, setVehicles] = useState([]);
  const [user, setCustomer] = useState({
    full_name: "Loading...",
    email: "...",
    profile_image: ""
  });

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(emptyVehicleForm);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [serviceForms, setServiceForms] = useState({});
  const [serviceLoadingId, setServiceLoadingId] = useState(null);

  // We keep validation errors in state so the UI stays human-friendly
  const [vehicleErrors, setVehicleErrors] = useState({});
  const [serviceErrors, setServiceErrors] = useState({});

  const authConfig = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` }
    }),
    [token]
  );

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

    const fetchGarageData = async () => {
      try {
        const [profileRes, garageRes] = await Promise.all([
          axios.get(`${API}/api/auth/profile`, authConfig),
          axios.get(`${API}/api/garage`, authConfig)
        ]);

        setCustomer({
          full_name: profileRes.data.full_name,
          email: profileRes.data.email,
          profile_image: profileRes.data.profile_image
          ? `${API}/${profileRes.data.profile_image}`
          : ""
        });

        setVehicles(garageRes.data);
      } catch (err) {
        console.error("Garage page load error:", err.response?.data || err.message);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchGarageData();
  }, [navigate, token, authConfig]);

  // Small helper to reduce repetitive code
  const setFieldError = (setter, name, message) => {
    setter((prev) => ({ ...prev, [name]: message }));
  };

  // Custom validation for vehicle form
  const validateVehicleForm = () => {
    const errors = {};

    if (!form.make.trim()) errors.make = "Please enter the vehicle make.";
    else if (form.make.trim().length < 2) errors.make = "Make should be at least 2 characters.";

    if (!form.model.trim()) errors.model = "Please enter the vehicle model.";
    else if (form.model.trim().length < 1) errors.model = "Model is required.";

    const yearNum = Number(form.year);
    const currentYear = new Date().getFullYear();
    if (!form.year) errors.year = "Please enter the vehicle year.";
    else if (Number.isNaN(yearNum) || yearNum < 1950 || yearNum > currentYear + 1) {
      errors.year = `Year must be between 1950 and ${currentYear + 1}.`;
    }

    if (!form.vehicle_no.trim()) errors.vehicle_no = "Please enter the vehicle number.";
    else if (form.vehicle_no.trim().length < 4) errors.vehicle_no = "Vehicle number looks too short.";

    if (!form.fuel_type.trim()) errors.fuel_type = "Please select a fuel type.";

    if (!form.engine_capacity.trim()) errors.engine_capacity = "Please enter engine capacity.";
    else if (form.engine_capacity.trim().length < 3) errors.engine_capacity = "Engine capacity looks too short.";

    if (!form.mileage.trim()) errors.mileage = "Please enter mileage.";
    else if (form.mileage.trim().length < 2) errors.mileage = "Mileage looks too short.";

    return errors;
  };

  // Custom validation for service record form
  const validateServiceForm = (serviceForm) => {
    const errors = {};

    if (!serviceForm.service_type.trim()) {
      errors.service_type = "Please enter a service type.";
    } else if (serviceForm.service_type.trim().length < 3) {
      errors.service_type = "Service type should be at least 3 characters.";
    }

    if (!serviceForm.service_date) {
      errors.service_date = "Please select the service date.";
    }

    if (
      serviceForm.mileage_at_service &&
      serviceForm.mileage_at_service.trim().length < 2
    ) {
      errors.mileage_at_service = "Mileage looks too short.";
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (vehicleErrors[name]) {
      setFieldError(setVehicleErrors, name, "");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    setForm((prev) => ({ ...prev, image_file: file }));
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const errors = validateVehicleForm();
    setVehicleErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("make", form.make.trim());
    formData.append("model", form.model.trim());
    formData.append("year", form.year);
    formData.append("vehicle_no", form.vehicle_no.trim());
    formData.append("fuel_type", form.fuel_type);
    formData.append("engine_capacity", form.engine_capacity.trim());
    formData.append("mileage", form.mileage.trim());

    if (form.image_file) {
      formData.append("image", form.image_file);
    }

    try {
      const res = await axios.post(`${API}/api/garage`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setVehicles((prev) => [res.data, ...prev]);
      setShowForm(false);
      setForm(emptyVehicleForm);
      setVehicleErrors({});
      setSuccessMessage("Vehicle added successfully.");
    } catch (err) {
      console.error("Error adding vehicle", err.response?.data || err.message);
      setFormError(err.response?.data?.message || "Failed to add vehicle.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Remove this vehicle from your garage?");
    if (!confirmed) return;

    try {
      await axios.delete(`${API}/api/garage/${id}`, authConfig);
      setVehicles((prev) => prev.filter((v) => v._id !== id));
      if (expandedHistoryId === id) setExpandedHistoryId(null);
    } catch (err) {
      console.error("Error deleting vehicle", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to delete vehicle.");
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      const res = await axios.patch(`${API}/api/garage/${id}/primary`, {}, authConfig);
      setVehicles(res.data.vehicles);
    } catch (err) {
      console.error("Error setting primary vehicle", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to set primary vehicle.");
    }
  };

  const handleFindParts = (vehicle) => {
    navigate(
      `/products?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(
        vehicle.model
      )}&year=${encodeURIComponent(vehicle.year)}`
    );
  };

  const handleServiceInputChange = (vehicleId, e) => {
    const { name, value } = e.target;

    setServiceForms((prev) => ({
      ...prev,
      [vehicleId]: {
        ...(prev[vehicleId] || emptyServiceForm),
        [name]: value
      }
    }));

    if (serviceErrors[vehicleId]?.[name]) {
      setServiceErrors((prev) => ({
        ...prev,
        [vehicleId]: {
          ...(prev[vehicleId] || {}),
          [name]: ""
        }
      }));
    }
  };

  const handleAddServiceRecord = async (vehicleId) => {
    const serviceForm = serviceForms[vehicleId] || emptyServiceForm;
    const errors = validateServiceForm(serviceForm);

    setServiceErrors((prev) => ({
      ...prev,
      [vehicleId]: errors
    }));

    if (Object.keys(errors).length > 0) return;

    try {
      setServiceLoadingId(vehicleId);

      const res = await axios.post(
        `${API}/api/garage/${vehicleId}/service-records`,
        serviceForm,
        authConfig
      );

      setVehicles((prev) =>
        prev.map((vehicle) => (vehicle._id === vehicleId ? res.data.vehicle : vehicle))
      );

      setServiceForms((prev) => ({
        ...prev,
        [vehicleId]: emptyServiceForm
      }));

      setServiceErrors((prev) => ({
        ...prev,
        [vehicleId]: {}
      }));

      setExpandedHistoryId(vehicleId);
    } catch (err) {
      console.error("Error adding service record", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to add service record.");
    } finally {
      setServiceLoadingId(null);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const text = searchTerm.toLowerCase();
    return (
      vehicle.make.toLowerCase().includes(text) ||
      vehicle.model.toLowerCase().includes(text) ||
      vehicle.vehicle_no.toLowerCase().includes(text)
    );
  });

  return (
    <div className="customer-garage-page">
      <Header />

      <div className="cd-layout">
        <div className="col-lg-3 col-xl-2 pe-0">
          <CustomerSidebar
            user={user}
            activeItem="garage"
            onLogout={handleLogout}
            handleLogout={handleLogout}
          />
        </div>

        <div className="col-lg-9 col-xl-10 ps-3">
          <main className="customer-garage-main">
            <div className="garage-topbar">
              <div>
                <h4 className="garage-title">My Garage</h4>
                <p className="garage-subtitle">
                  Save your vehicles, track service records, and quickly find matching parts.
                </p>
              </div>

              <div className="garage-top-actions">
                <div className="garage-count-badge">
                  {vehicles.length} Vehicle{vehicles.length !== 1 ? "s" : ""}
                </div>
                <button
                  className="add-vehicle-btn"
                  onClick={() => {
                    setShowForm((s) => !s);
                    setFormError("");
                    setSuccessMessage("");
                    setVehicleErrors({});
                  }}
                >
                  {showForm ? "Close Form" : "+ Add Vehicle"}
                </button>
              </div>
            </div>

            <div className="garage-toolbar">
              <input
                type="text"
                className="form-control garage-search"
                placeholder="Search by make, model, or vehicle number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {formError && <div className="alert alert-danger">{formError}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}

            {showForm && (
              <div className="garage-form-card mb-4">
                <div className="garage-section-header">
                  <h6 className="mb-1">Add New Vehicle</h6>
                  <p className="mb-0 text-muted small">
                    Add your vehicle details so Spare Ceylon can better support your parts search.
                  </p>
                </div>

                <form onSubmit={handleAddVehicle} noValidate>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small">Make</label>
                      <input
                        name="make"
                        placeholder="Toyota"
                        className={`form-control ${vehicleErrors.make ? "is-invalid" : ""}`}
                        value={form.make}
                        onChange={handleChange}
                      />
                      {vehicleErrors.make && <div className="invalid-feedback">{vehicleErrors.make}</div>}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small">Model</label>
                      <input
                        name="model"
                        placeholder="CHR"
                        className={`form-control ${vehicleErrors.model ? "is-invalid" : ""}`}
                        value={form.model}
                        onChange={handleChange}
                      />
                      {vehicleErrors.model && <div className="invalid-feedback">{vehicleErrors.model}</div>}
                    </div>

                    <div className="col-6 col-md-2">
                      <label className="form-label small">Year</label>
                      <input
                        name="year"
                        type="number"
                        placeholder="2024"
                        className={`form-control ${vehicleErrors.year ? "is-invalid" : ""}`}
                        value={form.year}
                        onChange={handleChange}
                      />
                      {vehicleErrors.year && <div className="invalid-feedback">{vehicleErrors.year}</div>}
                    </div>

                    <div className="col-6 col-md-2">
                      <label className="form-label small">Vehicle No.</label>
                      <input
                        name="vehicle_no"
                        placeholder="WP CBF-6428"
                        className={`form-control ${vehicleErrors.vehicle_no ? "is-invalid" : ""}`}
                        value={form.vehicle_no}
                        onChange={handleChange}
                      />
                      {vehicleErrors.vehicle_no && (
                        <div className="invalid-feedback">{vehicleErrors.vehicle_no}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small">Fuel Type</label>
                      <select
                        name="fuel_type"
                        className={`form-select ${vehicleErrors.fuel_type ? "is-invalid" : ""}`}
                        value={form.fuel_type}
                        onChange={handleChange}
                      >
                        <option>Petrol</option>
                        <option>Diesel</option>
                        <option>Hybrid</option>
                        <option>Electric</option>
                      </select>
                      {vehicleErrors.fuel_type && (
                        <div className="invalid-feedback">{vehicleErrors.fuel_type}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small">Engine Capacity</label>
                      <input
                        name="engine_capacity"
                        placeholder="1500cc"
                        className={`form-control ${
                          vehicleErrors.engine_capacity ? "is-invalid" : ""
                        }`}
                        value={form.engine_capacity}
                        onChange={handleChange}
                      />
                      {vehicleErrors.engine_capacity && (
                        <div className="invalid-feedback">{vehicleErrors.engine_capacity}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small">Mileage</label>
                      <input
                        name="mileage"
                        placeholder="25000km"
                        className={`form-control ${vehicleErrors.mileage ? "is-invalid" : ""}`}
                        value={form.mileage}
                        onChange={handleChange}
                      />
                      {vehicleErrors.mileage && (
                        <div className="invalid-feedback">{vehicleErrors.mileage}</div>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label small">Vehicle Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    <button type="submit" className="btn btn-success" disabled={loading}>
                      {loading ? "Saving..." : "Save Vehicle"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {pageLoading ? (
              <div className="text-muted">Loading your garage...</div>
            ) : (
              <div className="row g-4">
                {filteredVehicles.map((v) => {
                  const serviceForm = serviceForms[v._id] || emptyServiceForm;
                  const recordErrors = serviceErrors[v._id] || {};

                  return (
                    <div className="col-12 col-lg-6" key={v._id}>
                      <div className="garage-vehicle-card h-100">
                        <div className="vehicle-card-top">
                          <div className="vehicle-image-wrapper">
                            <img
                              src={
                                v.image_url
                                  ? `${API}/${v.image_url}`
                                  : "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg"
                              }
                              alt={`${v.make} ${v.model}`}
                              className="vehicle-image-tag"
                            />
                          </div>

                          <div className="vehicle-main-info">
                            <div className="vehicle-heading-row">
                              <div>
                                <h5 className="vehicle-title">
                                  {v.make} {v.model} {v.year}
                                </h5>
                                <span className="vehicle-no-badge">{v.vehicle_no}</span>
                              </div>

                              {v.is_primary && <span className="primary-badge">Primary</span>}
                            </div>

                            <div className="vehicle-spec-grid">
                              <div className="spec-item">
                                <span className="spec-label">Fuel Type</span>
                                <span className="spec-value">{v.fuel_type}</span>
                              </div>
                              <div className="spec-item">
                                <span className="spec-label">Engine</span>
                                <span className="spec-value">{v.engine_capacity}</span>
                              </div>
                              <div className="spec-item">
                                <span className="spec-label">Mileage</span>
                                <span className="spec-value">{v.mileage}</span>
                              </div>
                              <div className="spec-item">
                                <span className="spec-label">Records</span>
                                <span className="spec-value">{v.service_records?.length || 0}</span>
                              </div>
                            </div>

                            <div className="vehicle-actions">
                              {!v.is_primary && (
                                <button
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => handleSetPrimary(v._id)}
                                >
                                  Set Primary
                                </button>
                              )}

                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleFindParts(v)}
                              >
                                Find Parts
                              </button>

                              <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() =>
                                  setExpandedHistoryId(expandedHistoryId === v._id ? null : v._id)
                                }
                              >
                                {expandedHistoryId === v._id ? "Hide History" : "View History"}
                              </button>

                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDelete(v._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="service-form-box">
                          <h6 className="service-box-title">Add Service Record</h6>

                          <div className="row g-2">
                            <div className="col-12 col-md-6">
                              <input
                                type="text"
                                name="service_type"
                                className={`form-control ${
                                  recordErrors.service_type ? "is-invalid" : ""
                                }`}
                                placeholder="Oil Change / Brake Service"
                                value={serviceForm.service_type}
                                onChange={(e) => handleServiceInputChange(v._id, e)}
                              />
                              {recordErrors.service_type && (
                                <div className="invalid-feedback">{recordErrors.service_type}</div>
                              )}
                            </div>

                            <div className="col-12 col-md-6">
                              <input
                                type="date"
                                name="service_date"
                                className={`form-control ${
                                  recordErrors.service_date ? "is-invalid" : ""
                                }`}
                                value={serviceForm.service_date}
                                onChange={(e) => handleServiceInputChange(v._id, e)}
                              />
                              {recordErrors.service_date && (
                                <div className="invalid-feedback">{recordErrors.service_date}</div>
                              )}
                            </div>

                            <div className="col-12 col-md-6">
                              <input
                                type="text"
                                name="mileage_at_service"
                                className={`form-control ${
                                  recordErrors.mileage_at_service ? "is-invalid" : ""
                                }`}
                                placeholder="Mileage at service"
                                value={serviceForm.mileage_at_service}
                                onChange={(e) => handleServiceInputChange(v._id, e)}
                              />
                              {recordErrors.mileage_at_service && (
                                <div className="invalid-feedback">
                                  {recordErrors.mileage_at_service}
                                </div>
                              )}
                            </div>

                            <div className="col-12 col-md-6">
                              <input
                                type="text"
                                name="notes"
                                className="form-control"
                                placeholder="Notes (optional)"
                                value={serviceForm.notes}
                                onChange={(e) => handleServiceInputChange(v._id, e)}
                              />
                            </div>
                          </div>

                          <button
                            className="btn btn-dark btn-sm mt-3"
                            onClick={() => handleAddServiceRecord(v._id)}
                            disabled={serviceLoadingId === v._id}
                          >
                            {serviceLoadingId === v._id ? "Saving..." : "Save Service Record"}
                          </button>
                        </div>

                        {expandedHistoryId === v._id && (
                          <div className="service-history-box">
                            <div className="garage-section-header">
                              <h6 className="mb-1">Service History</h6>
                              <p className="mb-0 text-muted small">
                                Track important maintenance records for this vehicle.
                              </p>
                            </div>

                            {v.service_records?.length ? (
                              <div className="service-history-list">
                                {[...v.service_records]
                                  .sort(
                                    (a, b) =>
                                      new Date(b.service_date) - new Date(a.service_date)
                                  )
                                  .map((record) => (
                                    <div className="service-record-item" key={record._id}>
                                      <div className="service-record-top">
                                        <h6>{record.service_type}</h6>
                                        <span>
                                          {new Date(record.service_date).toLocaleDateString()}
                                        </span>
                                      </div>

                                      <div className="service-record-meta">
                                        {record.mileage_at_service && (
                                          <span>Mileage: {record.mileage_at_service}</span>
                                        )}
                                        <span>
                                          Added: {new Date(record.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>

                                      {record.notes && (
                                        <p className="service-record-notes">{record.notes}</p>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <div className="empty-history-text">
                                No service history added yet for this vehicle.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredVehicles.length === 0 && (
                  <div className="col-12">
                    <div className="garage-empty-state">
                      {vehicles.length === 0
                        ? 'No vehicles added yet. Click "Add Vehicle" to create your first entry.'
                        : "No vehicles matched your search."}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerGarage;