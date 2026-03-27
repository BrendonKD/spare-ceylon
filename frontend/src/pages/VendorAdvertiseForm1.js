import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import VendorSidebar from "../components/VendorSidebar";
import "./VendorAdvertiseForm.css";

const API = "http://localhost:5000";

// Status badge helper
const StatusBadge = ({ status }) => {
  const map = {
    pending:  { cls: "bg-warning text-dark", label: "Pending Review" },
    active:   { cls: "bg-success",           label: "Active" },
    rejected: { cls: "bg-danger",            label: "Rejected" },
    expired:  { cls: "bg-secondary",         label: "Expired" }
  };
  const { cls, label } = map[status] || { cls: "bg-secondary", label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
};

const VendorAdvertiseForm = () => {
  const token = localStorage.getItem("token");
  const [vendor, setVendor] = useState({ full_name: 'Loading...', email: '' });

  // Form state
  const [form, setForm] = useState({
    slot:          "left",
    title:         "",
    description:   "",
    cta_label:     "Shop Now",
    duration_days: 7,
    payment_note:  ""
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [successMsg,   setSuccessMsg]   = useState("");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [myAds,       setMyAds]       = useState([]);
  const [loadingAds,  setLoadingAds]  = useState(true);
  const [showForm,    setShowForm]    = useState(false);

  const PRICE_PER_DAY = 500;
  const estimatedCost = form.duration_days * PRICE_PER_DAY;

  // Load vendor profile + existing ads
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load vendor profile for sidebar
        const profileRes = await axios.get(`${API}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVendor(profileRes.data);

        // Load my ads
        const adsRes = await axios.get(`${API}/api/ads/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyAds(adsRes.data);
      } catch (err) {
        console.error("Load data error:", err);
      } finally {
        setLoadingAds(false);
      }
    };
    if (token) loadData();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (imageFile) data.append("image", imageFile);

      await axios.post(`${API}/api/ads`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setSuccessMsg(
        "Your ad request has been submitted! Our team will review and activate it shortly."
      );
      setForm({
        slot: "left", title: "", description: "",
        cta_label: "Shop Now", duration_days: 7, payment_note: ""
      });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);

      // Refresh my ads list
      const res = await axios.get(`${API}/api/ads/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyAds(res.data);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="vendor-advertise-form">
      <Header />
      
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-3">
            <VendorSidebar 
              vendor={vendor} 
              activeItem="advertise"
              onLogout={handleLogout} 
            />
          </div>

          {/* Main content */}
          <div className="col-lg-9">
            <div className="content-wrapper">
              
              {/* Page Header */}
              <div className="page-header">
                <div>
                  <h4 className="mb-1 fw-bold">Advertise on Spare Ceylon</h4>
                  <p className="text-muted small mb-0">
                    Promote your business on the homepage — reach thousands of buyers.
                  </p>
                </div>
                <button
                  className="btn btn-primary px-4"
                  onClick={() => { setShowForm(!showForm); setSuccessMsg(""); setErrorMsg(""); }}
                >
                  {showForm ? "Cancel" : "+ New Ad Request"}
                </button>
              </div>

              {/* Pricing info banner */}
              <div className="pricing-banner">
                <div>
                  <div className="pricing-label">Rate</div>
                  <div className="pricing-value">LKR {PRICE_PER_DAY.toLocaleString()} / day</div>
                </div>
                <div>
                  <div className="pricing-label">Slots Available</div>
                  <div className="pricing-value">Left Card & Right Card</div>
                </div>
                <div>
                  <div className="pricing-label">Payment</div>
                  <div className="pricing-value">Bank transfer — include ref in form</div>
                </div>
                <div>
                  <div className="pricing-label">Activation</div>
                  <div className="pricing-value">Within 24 hrs of approval</div>
                </div>
              </div>

              {/* Success / Error messages */}
              {successMsg && (
                <div className="alert alert-success d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined">check_circle</span>
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="alert alert-danger d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  {errorMsg}
                </div>
              )}

              {/* Submission Form */}
              {showForm && (
                <div className="ad-form-card">
                  <div className="card-body">
                    <h5 className="fw-bold mb-4">New Advertisement Request</h5>
                    <form onSubmit={handleSubmit}>
                      
                      {/* Slot + Duration row */}
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Ad Slot <span className="text-danger">*</span>
                          </label>
                          <div className="slot-selector">
                            {["left", "right"].map((s) => (
                              <div
                                key={s}
                                className={`slot-option ${form.slot === s ? 'active' : ''}`}
                                onClick={() => setForm((p) => ({ ...p, slot: s }))}
                              >
                                <span className="material-symbols-outlined">
                                  {s === "left" ? "left_panel_open" : "right_panel_open"}
                                </span>
                                <small className="fw-semibold text-capitalize">{s} Card</small>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Duration (days) <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            name="duration_days"
                            value={form.duration_days}
                            onChange={handleChange}
                            min={1}
                            max={90}
                            required
                          />
                          <div className="form-text text-success fw-semibold">
                            Estimated cost: LKR {estimatedCost.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Ad Title <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          placeholder='e.g. "Engine Parts Clearance Sale"'
                          value={form.title}
                          onChange={handleChange}
                          maxLength={60}
                          required
                        />
                        <div className="form-text">{form.title.length}/60 characters</div>
                      </div>

                      {/* Description */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Short Description <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          name="description"
                          rows={2}
                          placeholder='e.g. "Up to 40% off genuine parts this week only"'
                          value={form.description}
                          onChange={handleChange}
                          maxLength={120}
                          required
                        />
                        <div className="form-text">{form.description.length}/120 characters</div>
                      </div>

                      {/* CTA label */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Button Label</label>
                        <input
                          type="text"
                          className="form-control"
                          name="cta_label"
                          placeholder="Shop Now"
                          value={form.cta_label}
                          onChange={handleChange}
                          maxLength={30}
                        />
                      </div>

                      {/* Background image */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Background Image</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageChange}
                        />
                        <div className="form-text">
                          Recommended: 800×400px landscape. Max 5 MB. A dark overlay will be applied automatically.
                        </div>
                        {imagePreview && (
                          <div className="image-preview">
                            <img
                              src={imagePreview}
                              alt="preview"
                              className="img-fluid"
                            />
                            <button
                              type="button"
                              className="preview-remove"
                              onClick={() => { setImageFile(null); setImagePreview(null); }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Payment note */}
                      <div className="mb-4">
                        <label className="form-label fw-semibold">
                          Payment Reference / Note <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          name="payment_note"
                          rows={2}
                          placeholder="e.g. Bank transfer ref #TXN20240115 — LKR 3,500 sent to BOC acc 8001XXXX"
                          value={form.payment_note}
                          onChange={handleChange}
                          maxLength={200}
                          required
                        />
                        <div className="form-text">
                          Include your bank transfer reference so admin can verify payment.
                        </div>
                      </div>

                      {/* Ad preview */}
                      {(form.title || form.description) && (
                        <div className="ad-preview mb-4">
                          <div className="form-label fw-semibold mb-2">Live Preview</div>
                          <div className="preview-container">
                            <div className="preview-card"></div>
                          </div>
                        </div>
                      )}

                      <div className="form-actions">
                        <button
                          type="submit"
                          className="btn btn-primary px-4"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Ad Request"
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary px-4"
                          onClick={() => setShowForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* My Ad Requests */}
              <div className="my-ads-section">
                <h5 className="fw-bold mb-3">My Ad Requests</h5>

                {loadingAds ? (
                  <div className="loading-spinner">
                    <div className="spinner-border text-primary" />
                  </div>
                ) : myAds.length === 0 ? (
                  <div className="empty-state">
                    <span className="material-symbols-outlined">campaign</span>
                    <p>No ad requests yet. Click <strong>+ New Ad Request</strong> to get started.</p>
                  </div>
                ) : (
                  <div className="ads-list">
                    {myAds.map((ad) => (
                      <div key={ad._id} className="ad-card">
                        <div className="ad-body">
                          <div className="d-flex gap-3 align-items-start">
                            {/* Thumbnail */}
                            {ad.image_url ? (
                              <img
                                src={`${API}${ad.image_url}`}
                                alt={ad.title}
                                className="ad-thumbnail"
                              />
                            ) : (
                              <div className="ad-thumbnail-placeholder">
                                <span className="material-symbols-outlined">image</span>
                              </div>
                            )}

                            {/* Details */}
                            <div className="ad-details">
                              <div className="d-flex justify-content-between align-items-start flex-wrap gap-1">
                                <div>
                                  <span className="fw-semibold">{ad.title}</span>
                                  <span className="slot-badge">{ad.slot} slot</span>
                                </div>
                                <StatusBadge status={ad.status} />
                              </div>

                              <p className="ad-desc">{ad.description}</p>

                              <div className="ad-meta">
                                <small>
                                  <span className="material-symbols-outlined">schedule</span>
                                  {ad.duration_days} days
                                </small>
                                {ad.start_date && (
                                  <small>
                                    <span className="material-symbols-outlined">calendar_today</span>
                                    {new Date(ad.start_date).toLocaleDateString()} –{" "}
                                    {new Date(ad.end_date).toLocaleDateString()}
                                  </small>
                                )}
                              </div>

                              {ad.admin_note && (
                                <div className="admin-note">
                                  <strong>Note:</strong> {ad.admin_note}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAdvertiseForm;