import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Header from "../admin/components/AdminHeader";
import AdminSidebar from "../admin/components/AdminSidebar";
import "./styles/AdminSubscriptions.css";

const API = "http://localhost:5000";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price_monthly: 0,
  price_yearly: 0,
  currency: "LKR",
  is_free: false,
  features: "",
  listing_limit: 0,
  has_featured_badge: false,
  has_advanced_analytics: false,
  has_priority_support: false,
  has_homepage_promotion: false,
  ad_credits: 0,
  status: "active",
  is_recommended: false,
};

const assignInitial = {
  vendor_id: "",
  plan_id: "",
  billing_cycle: "monthly",
  notes: "",
};

const AdminSubscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [vendorSubscriptions, setVendorSubscriptions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({
    totalActiveSubscribedVendors: 0,
    totalSubscriptionEarnings: 0,
    planBreakdown: {
      basic: { vendors: 0, earnings: 0 },
      pro: { vendors: 0, earnings: 0 },
      premium: { vendors: 0, earnings: 0 },
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("");

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [editingPlanId, setEditingPlanId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [assignForm, setAssignForm] = useState(assignInitial);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [plansRes, subscriptionsRes, statsRes, usersRes] = await Promise.all([
        axios.get(`${API}/api/subscriptions/admin/plans`, authHeaders()),
        axios.get(`${API}/api/subscriptions/admin/all`, authHeaders()),
        axios.get(`${API}/api/subscriptions/admin/stats`, authHeaders()),
        axios.get(`${API}/api/admin/users`, authHeaders()),
      ]);

      setPlans(plansRes.data || []);
      setVendorSubscriptions(subscriptionsRes.data || []);
      setStats(statsRes.data || stats);
      setVendors((usersRes.data || []).filter((u) => u.role === "vendor"));
    } catch (err) {
      console.error("Failed to load subscription admin data", err);
      alert(err.response?.data?.message || "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const featureText = Array.isArray(plan.features) ? plan.features.join(", ") : "";
      const matchesSearch =
        plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        featureText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.description || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || plan.status?.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [plans, searchTerm, statusFilter]);

  const activeVendorSubscriptions = useMemo(() => {
    return vendorSubscriptions.filter((sub) => {
      const vendorName = sub.vendor_id?.full_name || "";
      const vendorEmail = sub.vendor_id?.email || "";
      const planName = sub.plan_id?.name || "";
      const matchesVendor =
        vendorName.toLowerCase().includes(vendorFilter.toLowerCase()) ||
        vendorEmail.toLowerCase().includes(vendorFilter.toLowerCase()) ||
        planName.toLowerCase().includes(vendorFilter.toLowerCase());

      return sub.status === "active" && matchesVendor;
    });
  }, [vendorSubscriptions, vendorFilter]);

  const formatMoney = (amount) => `Rs. ${Number(amount || 0).toLocaleString()}`;

  const openCreateModal = () => {
    setEditingPlanId(null);
    setFormData(emptyForm);
    setShowPlanModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlanId(plan._id);
    setFormData({
      name: plan.name || "",
      slug: plan.slug || "",
      description: plan.description || "",
      price_monthly: plan.price_monthly || 0,
      price_yearly: plan.price_yearly || 0,
      currency: plan.currency || "LKR",
      is_free: !!plan.is_free,
      features: Array.isArray(plan.features) ? plan.features.join(", ") : "",
      listing_limit: plan.listing_limit || 0,
      has_featured_badge: !!plan.has_featured_badge,
      has_advanced_analytics: !!plan.has_advanced_analytics,
      has_priority_support: !!plan.has_priority_support,
      has_homepage_promotion: !!plan.has_homepage_promotion,
      ad_credits: plan.ad_credits || 0,
      status: plan.status || "active",
      is_recommended: !!plan.is_recommended,
    });
    setShowPlanModal(true);
  };

  const closePlanModal = () => {
    setShowPlanModal(false);
    setEditingPlanId(null);
    setFormData(emptyForm);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setAssignForm(assignInitial);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleAssignChange = (e) => {
    const { name, value } = e.target;
    setAssignForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...formData,
        features: formData.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      };

      if (payload.is_free) {
        payload.price_monthly = 0;
        payload.price_yearly = 0;
      }

      if (editingPlanId) {
        await axios.put(`${API}/api/subscriptions/plans/${editingPlanId}`, payload, authHeaders());
      } else {
        await axios.post(`${API}/api/subscriptions/plans`, payload, authHeaders());
      }

      await fetchData();
      closePlanModal();
    } catch (err) {
      console.error("Save plan error:", err);
      alert(err.response?.data?.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivatePlan = async (id) => {
    try {
      await axios.patch(`${API}/api/subscriptions/plans/${id}/deactivate`, {}, authHeaders());
      await fetchData();
    } catch (err) {
      console.error("Deactivate plan error:", err);
      alert(err.response?.data?.message || "Failed to deactivate plan");
    }
  };

  const handleDeletePlan = async (id) => {
    const confirmed = window.confirm("Are you sure you want to permanently delete this plan?");
    if (!confirmed) return;

    try {
      await axios.delete(`${API}/api/subscriptions/plans/${id}`, authHeaders());
      await fetchData();
    } catch (err) {
      console.error("Delete plan error:", err);
      alert(err.response?.data?.message || "Failed to delete plan");
    }
  };

  const handleAssignSubscription = async (e) => {
    e.preventDefault();

    try {
      setAssigning(true);
      await axios.post(`${API}/api/subscriptions/admin/assign`, assignForm, authHeaders());
      await fetchData();
      closeAssignModal();
    } catch (err) {
      console.error("Assign subscription error:", err);
      alert(err.response?.data?.message || "Failed to assign subscription");
    } finally {
      setAssigning(false);
    }
  };

  const handleDeactivateVendorSubscription = async (vendorId) => {
    const confirmed = window.confirm("Deactivate this vendor's active subscription?");
    if (!confirmed) return;

    try {
      await axios.patch(
        `${API}/api/subscriptions/admin/vendor/${vendorId}/deactivate`,
        {},
        authHeaders()
      );
      await fetchData();
    } catch (err) {
      console.error("Deactivate vendor subscription error:", err);
      alert(err.response?.data?.message || "Failed to deactivate vendor subscription");
    }
  };

  return (
    <div className="admin-subscriptions-page">
      <Header />

      <div className="as-layout">
        <AdminSidebar activeItem="subscriptions" />

        <main className="as-main">
          <section className="as-hero-card">
            <div>
              <span className="as-eyebrow">Admin Subscription Control</span>
              <h2 className="as-title">Subscription Performance & Access Control</h2>
              <p className="as-subtitle">
                Track active vendors, review subscription earnings, and manage vendor access from one place.
              </p>
            </div>

            <div className="as-hero-actions">
              <button className="as-create-btn" onClick={() => setShowAssignModal(true)}>
                <span className="material-symbols-outlined">person_add</span>
                Assign Subscription
              </button>
              <button className="as-create-btn secondary" onClick={openCreateModal}>
                <span className="material-symbols-outlined">add</span>
                Add New Plan
              </button>
            </div>
          </section>

          <section className="as-metrics-grid">
            <div className="as-kpi-card">
              <div className="as-kpi-top">
                <span className="material-symbols-outlined">groups</span>
                <span>Total Subscribed Vendors</span>
              </div>
              <h3>{stats.totalActiveSubscribedVendors}</h3>
              <div className="as-mini-stats">
                <div><strong>Basic</strong><span>{stats.planBreakdown.basic.vendors}</span></div>
                <div><strong>Pro</strong><span>{stats.planBreakdown.pro.vendors}</span></div>
                <div><strong>Premium</strong><span>{stats.planBreakdown.premium.vendors}</span></div>
              </div>
            </div>

            <div className="as-kpi-card">
              <div className="as-kpi-top">
                <span className="material-symbols-outlined">payments</span>
                <span>Total Earnings</span>
              </div>
              <h3>{formatMoney(stats.totalSubscriptionEarnings)}</h3>
              <div className="as-mini-stats">
                <div><strong>Basic</strong><span>{formatMoney(stats.planBreakdown.basic.earnings)}</span></div>
                <div><strong>Pro</strong><span>{formatMoney(stats.planBreakdown.pro.earnings)}</span></div>
                <div><strong>Premium</strong><span>{formatMoney(stats.planBreakdown.premium.earnings)}</span></div>
              </div>
            </div>
          </section>

          <section className="as-panel">
            <div className="as-panel-head">
              <div>
                <h4>Vendor Subscription Control</h4>
                <p>Manage active vendor subscriptions and admin-issued plan access.</p>
              </div>

              <input
                type="text"
                className="form-control as-search"
                placeholder="Search vendor, email, or plan..."
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="as-empty">Loading vendor subscriptions...</div>
            ) : activeVendorSubscriptions.length === 0 ? (
              <div className="as-empty">No active vendor subscriptions found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle as-table mb-0">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Plan</th>
                      <th>Billing</th>
                      <th>Paid</th>
                      <th>Period</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVendorSubscriptions.map((sub) => (
                      <tr key={sub._id}>
                        <td>
                          <div className="as-vendor-cell">
                            <div className="as-avatar">
                              {(sub.vendor_id?.full_name || "V").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold">{sub.vendor_id?.full_name || "Unknown Vendor"}</div>
                              <div className="text-muted small">{sub.vendor_id?.email || "-"}</div>
                            </div>
                          </div>
                        </td>
                        <td>{sub.plan_id?.name || "-"}</td>
                        <td className="text-capitalize">{sub.billing_cycle || "-"}</td>
                        <td>{formatMoney(sub.price_paid)}</td>
                        <td>
                          <div className="small">
                            <div>{new Date(sub.start_date).toLocaleDateString()}</div>
                            <div className="text-muted">to {new Date(sub.end_date).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td>
                          {sub.activated_by_admin ? (
                            <span className="as-badge admin">Admin assigned</span>
                          ) : (
                            <span className="as-badge paid">Vendor checkout</span>
                          )}
                        </td>
                        <td>
                          <span className={`as-status ${sub.status?.toLowerCase()}`}>{sub.status}</span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-secondary me-2"
                            onClick={() => {
                              setAssignForm({
                                vendor_id: sub.vendor_id?._id || "",
                                plan_id: sub.plan_id?._id || "",
                                billing_cycle: sub.billing_cycle || "monthly",
                                notes: "",
                              });
                              setShowAssignModal(true);
                            }}
                          >
                            Reassign
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeactivateVendorSubscription(sub.vendor_id?._id)}
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="as-panel">
            <div className="as-panel-head">
              <div>
                <h4>Subscription Plans</h4>
                <p>Create, edit, and manage all available vendor plans.</p>
              </div>

              <div className="as-filter-row">
                <input
                  type="text"
                  className="form-control as-search"
                  placeholder="Search plans or features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                  className="form-select as-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="as-empty">Loading subscription plans...</div>
            ) : filteredPlans.length === 0 ? (
              <div className="as-empty">No subscription plans found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle as-table mb-0">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Price</th>
                      <th>Features</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlans.map((plan) => (
                      <tr key={plan._id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <span
                              className="as-dot"
                              style={{
                                backgroundColor:
                                  plan.slug === "basic"
                                    ? "#0E544F"
                                    : plan.slug === "pro"
                                    ? "#EB7623"
                                    : plan.slug === "premium"
                                    ? "#8D183A"
                                    : "#6c757d",
                              }}
                            />
                            <div>
                              <div className="fw-bold">{plan.name}</div>
                              <div className="text-muted small">{plan.description}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {plan.is_free || Number(plan.price_monthly) === 0
                            ? "Free"
                            : `Rs. ${Number(plan.price_monthly).toLocaleString()} / month`}
                        </td>
                        <td className="text-muted">
                          {Array.isArray(plan.features) ? plan.features.join(", ") : "-"}
                        </td>
                        <td>
                          <span className={`as-status ${plan.status?.toLowerCase()}`}>{plan.status}</span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-secondary me-2"
                            onClick={() => openEditModal(plan)}
                          >
                            Edit
                          </button>

                          {plan.status === "active" && (
                            <button
                              className="btn btn-sm as-manage-btn me-2"
                              onClick={() => handleDeactivatePlan(plan._id)}
                            >
                              Deactivate
                            </button>
                          )}

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeletePlan(plan._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {showPlanModal && (
        <div className="as-modal-backdrop">
          <div className="as-modal card border-0 shadow">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  {editingPlanId ? "Edit Subscription Plan" : "Create Subscription Plan"}
                </h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={closePlanModal}>
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Plan Name</label>
                    <select name="name" className="form-select" value={formData.name} onChange={handleChange} required>
                      <option value="">Select plan</option>
                      <option value="Basic">Basic</option>
                      <option value="Pro">Pro</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Slug</label>
                    <select name="slug" className="form-select" value={formData.slug} onChange={handleChange} required>
                      <option value="">Select slug</option>
                      <option value="basic">basic</option>
                      <option value="pro">pro</option>
                      <option value="premium">premium</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Monthly Price</label>
                    <input
                      type="number"
                      name="price_monthly"
                      className="form-control"
                      value={formData.price_monthly}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Yearly Price</label>
                    <input
                      type="number"
                      name="price_yearly"
                      className="form-control"
                      value={formData.price_yearly}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Currency</label>
                    <input
                      type="text"
                      name="currency"
                      className="form-control"
                      value={formData.currency}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Listing Limit</label>
                    <input
                      type="number"
                      name="listing_limit"
                      className="form-control"
                      value={formData.listing_limit}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Ad Credits</label>
                    <input
                      type="number"
                      name="ad_credits"
                      className="form-control"
                      value={formData.ad_credits}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Features (comma separated)</label>
                    <textarea
                      name="features"
                      className="form-control"
                      rows="3"
                      value={formData.features}
                      onChange={handleChange}
                      placeholder="e.g. 25 listings, badge, analytics"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      className="form-select"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="col-md-6 d-flex align-items-center">
                    <div className="form-check mt-4">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="is_recommended"
                        name="is_recommended"
                        checked={formData.is_recommended}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="is_recommended">
                        Recommended plan
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6 d-flex align-items-center">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="is_free"
                        name="is_free"
                        checked={formData.is_free}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="is_free">
                        Free plan
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6 d-flex align-items-center">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="has_featured_badge"
                        name="has_featured_badge"
                        checked={formData.has_featured_badge}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="has_featured_badge">
                        Featured badge
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6 d-flex align-items-center">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="has_advanced_analytics"
                        name="has_advanced_analytics"
                        checked={formData.has_advanced_analytics}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="has_advanced_analytics">
                        Advanced analytics
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6 d-flex align-items-center">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="has_priority_support"
                        name="has_priority_support"
                        checked={formData.has_priority_support}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="has_priority_support">
                        Priority support
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6 d-flex align-items-center">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="has_homepage_promotion"
                        name="has_homepage_promotion"
                        checked={formData.has_homepage_promotion}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="has_homepage_promotion">
                        Homepage promotion
                      </label>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={closePlanModal}>
                    Cancel
                  </button>
                  <button type="submit" className="as-create-btn" disabled={saving}>
                    {saving ? "Saving..." : editingPlanId ? "Update Plan" : "Create Plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="as-modal-backdrop">
          <div className="as-modal card border-0 shadow">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Assign Subscription to Vendor</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={closeAssignModal}>
                  Close
                </button>
              </div>

              <form onSubmit={handleAssignSubscription}>
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label">Vendor</label>
                    <select
                      name="vendor_id"
                      className="form-select"
                      value={assignForm.vendor_id}
                      onChange={handleAssignChange}
                      required
                    >
                      <option value="">Select vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.full_name} - {vendor.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Plan</label>
                    <select
                      name="plan_id"
                      className="form-select"
                      value={assignForm.plan_id}
                      onChange={handleAssignChange}
                      required
                    >
                      <option value="">Select plan</option>
                      {plans
                        .filter((p) => p.status === "active")
                        .map((plan) => (
                          <option key={plan._id} value={plan._id}>
                            {plan.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Billing Cycle</label>
                    <select
                      name="billing_cycle"
                      className="form-select"
                      value={assignForm.billing_cycle}
                      onChange={handleAssignChange}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Notes</label>
                    <textarea
                      name="notes"
                      className="form-control"
                      rows="3"
                      value={assignForm.notes}
                      onChange={handleAssignChange}
                      placeholder="Optional admin note"
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeAssignModal}>
                    Cancel
                  </button>
                  <button type="submit" className="as-create-btn" disabled={assigning}>
                    {assigning ? "Assigning..." : "Assign Subscription"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;