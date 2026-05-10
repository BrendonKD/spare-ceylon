import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import VendorSidebar from "../components/VendorSidebar";
import "./styles/VendorAdvertiseForm.css";

const API = "http://localhost:5000";

// Status badge helper
const StatusBadge = ({ status }) => {
  const map = {
    pending: { cls: "bg-warning text-dark", label: "Pending Review" },
    active: { cls: "bg-success", label: "Active" },
    rejected: { cls: "bg-danger", label: "Rejected" },
    expired: { cls: "bg-secondary", label: "Expired" }
  };
  const { cls, label } = map[status] || { cls: "bg-secondary", label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
};

const VendorAdvertiseForm = () => {
  const token = localStorage.getItem("token");
  const [vendor, setVendor] = useState({ full_name: "Loading...", email: "", logo_url: "" });

  const [form, setForm] = useState({
    slot: "left",
    title: "",
    description: "",
    cta_label: "Shop Now",
    duration_days: 7
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [myAds, setMyAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const PRICE_PER_DAY = 500;
  const estimatedCost = (Number(form.duration_days) || 0) * PRICE_PER_DAY;

  // Handle Stripe Redirection URL Params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (payment === "success") {
      setSuccessMsg("Payment successful! Your ad is now pending admin review.");
      setShowForm(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === "cancelled") {
      setErrorMsg("Payment was cancelled. Your ad request was not submitted.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, adsRes] = await Promise.all([
          axios.get(`${API}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/api/ads/my`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setVendor({
        ...profileRes.data,
        logo_url: profileRes.data.logo_url
          ? `${API}/${profileRes.data.logo_url.replace(/^\/+/, "")}`
          : ""
      });
        setMyAds(adsRes.data);
      } catch (err) {
        console.error("Error loading vendor data:", err);
      } finally {
        setLoadingAds(false);
      }
    };

    if (token) loadData();
  }, [token]);

  // Refresh ads when a payment succeeds
  useEffect(() => {
    if (successMsg && token) {
      const refresh = async () => {
        try {
          const res = await axios.get(`${API}/api/ads/my`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMyAds(res.data);
        } catch (err) { console.error(err); }
      };
      refresh();
    }
  }, [successMsg, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "duration_days" ? value.replace(/^0+/, "") : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Clean up old preview URL to save memory
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearForm = () => {
    setForm({
      slot: "left",
      title: "",
      description: "",
      cta_label: "Shop Now",
      duration_days: 7
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (imageFile) data.append("image", imageFile);

      const res = await axios.post(`${API}/api/ads/create-checkout-session`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      clearForm();
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Payment setup failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="vendor-advertise-form">
      <Header />

      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3">
            <VendorSidebar vendor={vendor} activeItem="advertise" onLogout={handleLogout} />
          </div>

          <div className="col-lg-9">
            <div className="content-wrapper">
              
              <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="mb-1 fw-bold">Advertise on Spare Ceylon</h4>
                  <p className="text-muted small mb-0">Boost your sales by appearing on the main landing page.</p>
                </div>
                <button 
                  className={`btn ${showForm ? 'btn-outline-danger' : 'btn-primary'} px-4`}
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? "Cancel" : "+ New Ad Request"}
                </button>
              </div>

              <div className="pricing-banner mb-4">
                <div className="text-center">
                  <div className="pricing-label">Daily Rate</div>
                  <div className="pricing-value">LKR {PRICE_PER_DAY.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="pricing-label">Ad Slots</div>
                  <div className="pricing-value">Homepage Left/Right</div>
                </div>
                <div className="text-center">
                  <div className="pricing-label">Secure Payment</div>
                  <div className="pricing-value">Stripe Protected</div>
                </div>
              </div>

              {successMsg && <div className="alert alert-success">{successMsg}</div>}
              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              {showForm && (
                <div className="ad-form-card card shadow-sm mb-5">
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-4 border-bottom pb-2">Create New Ad</h5>
                    <form onSubmit={handleSubmit}>
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Ad Slot <span className="text-danger">*</span></label>
                          <div className="slot-selector d-flex gap-2">
                            {["left", "right"].map((s) => (
                              <div
                                key={s}
                                className={`slot-option border p-2 flex-grow-1 text-center rounded cursor-pointer ${form.slot === s ? "bg-primary text-white border-primary" : ""}`}
                                onClick={() => setForm({ ...form, slot: s })}
                                style={{ cursor: 'pointer' }}
                              >
                                <small className="fw-bold text-capitalize">{s} Card</small>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Duration (Days)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="duration_days"
                            value={form.duration_days}
                            onChange={handleChange}
                            min={1} max={90} required
                          />
                          <div className="form-text text-success fw-bold">Total: LKR {estimatedCost.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Ad Title</label>
                        <input
                          type="text" className="form-control" name="title"
                          placeholder="Short catchy title"
                          value={form.title} onChange={handleChange} maxLength={60} required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Description</label>
                        <textarea
                          className="form-control" name="description" rows={2}
                          placeholder="Briefly explain the offer..."
                          value={form.description} onChange={handleChange} maxLength={120} required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-semibold">Ad Background Image</label>
                        <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                        {imagePreview && (
                          <div className="mt-3 position-relative d-inline-block">
                            <img src={imagePreview} alt="preview" className="rounded" style={{ maxHeight: '150px' }} />
                            <button 
                              type="button" 
                              className="btn btn-sm btn-danger position-absolute top-0 end-0"
                              onClick={() => { setImageFile(null); setImagePreview(null); }}
                            >✕</button>
                          </div>
                        )}
                      </div>

                      {/* Dynamic Live Preview */}
                      {(form.title || form.description) && (
                        <div className="ad-preview-wrapper mb-4 p-3 bg-light rounded">
                          <label className="small fw-bold text-muted mb-2 d-block">REAL-TIME PREVIEW</label>
                          <div 
                            className="preview-card-styled text-white p-4 rounded shadow-sm"
                            style={{ 
                              backgroundImage: imagePreview ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${imagePreview})` : 'linear-gradient(45deg, #2c3e50, #34495e)',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              minHeight: '180px'
                            }}
                          >
                            <h4 className="fw-bold">{form.title || "Your Ad Title"}</h4>
                            <p className="small mb-3">{form.description || "Your description will appear here..."}</p>
                            <button className="btn btn-light btn-sm fw-bold px-4" disabled>{form.cta_label}</button>
                          </div>
                        </div>
                      )}

                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary px-5" disabled={submitting}>
                          {submitting ? "Redirecting to Stripe..." : "Pay & Submit"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="my-ads-section">
                <h5 className="fw-bold mb-3">Your Advertisement History</h5>
                {loadingAds ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : myAds.length === 0 ? (
                  <div className="alert alert-light border text-center py-4">No active or past ads found.</div>
                ) : (
                  <div className="row g-3">
                    {myAds.map((ad) => (
                      <div key={ad._id} className="col-12">
                        <div className="card shadow-sm border-0">
                          <div className="card-body d-flex gap-3 align-items-center">
                            <div className="bg-light rounded overflow-hidden" style={{ width: '100px', height: '60px' }}>
                              {ad.image_url ? (
                                <img src={`${API}${ad.image_url}`} alt="ad" className="w-100 h-100 object-fit-cover" />
                              ) : (
                                <div className="h-100 d-flex align-items-center justify-content-center text-muted">No Image</div>
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start">
                                <h6 className="mb-0 fw-bold">{ad.title} <small className="badge bg-light text-dark border ms-2">{ad.slot}</small></h6>
                                <StatusBadge status={ad.status} />
                              </div>
                              <small className="text-muted d-block">{ad.duration_days} days • LKR {ad.payment_amount?.toLocaleString()}</small>
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