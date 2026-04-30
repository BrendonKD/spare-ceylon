import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Header from "../admin/components/AdminHeader";
import AdminSidebar from "../admin/components/AdminSidebar";
import "./AdminSubscriptions.css";

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

const AdminSubscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [vendorSubscriptions, setVendorSubscriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [plansRes, subscriptionsRes] = await Promise.all([
        axios.get(`${API}/api/subscriptions/admin/plans`, authHeaders()),
        axios.get(`${API}/api/subscriptions/admin/all`, authHeaders()),
      ]);

      setPlans(plansRes.data);
      setVendorSubscriptions(subscriptionsRes.data);
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

  const planVendorCounts = useMemo(() => {
    const counts = {};

    vendorSubscriptions.forEach((sub) => {
      const planId = sub.plan_id?._id || sub.plan_id;
      if (!planId) return;
      counts[planId] = (counts[planId] || 0) + 1;
    });

    return counts;
  }, [vendorSubscriptions]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const featureText = Array.isArray(plan.features)
        ? plan.features.join(", ")
        : "";

      const matchesSearch =
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        featureText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || plan.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [plans, searchTerm, statusFilter]);

  const totalPlans = plans.length;
  const totalVendors = vendorSubscriptions.length;
  const premiumPlan = plans.find((p) => p.name === "Premium");
  const proPlan = plans.find((p) => p.name === "Pro");
  const premiumVendors = premiumPlan ? planVendorCounts[premiumPlan._id] || 0 : 0;
  const proVendors = proPlan ? planVendorCounts[proPlan._id] || 0 : 0;

  const getPlanColor = (slug) => {
    if (slug === "basic") return "#0E544F";
    if (slug === "pro") return "#EB7623";
    if (slug === "premium") return "#8D183A";
    return "#6c757d";
  };

  const formatPrice = (plan) => {
    if (plan.is_free || Number(plan.price_monthly) === 0) return "Free";
    return `Rs. ${Number(plan.price_monthly).toLocaleString()} / month`;
  };

  const openCreateModal = () => {
    setEditingPlanId(null);
    setFormData(emptyForm);
    setShowModal(true);
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
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlanId(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
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
        await axios.put(
          `${API}/api/subscriptions/plans/${editingPlanId}`,
          payload,
          authHeaders()
        );
      } else {
        await axios.post(
          `${API}/api/subscriptions/plans`,
          payload,
          authHeaders()
        );
      }

      await fetchData();
      closeModal();
    } catch (err) {
      console.error("Save plan error:", err);
      alert(err.response?.data?.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axios.patch(
        `${API}/api/subscriptions/plans/${id}/deactivate`,
        {},
        authHeaders()
      );
      await fetchData();
    } catch (err) {
      console.error("Deactivate plan error:", err);
      alert(err.response?.data?.message || "Failed to deactivate plan");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this plan?"
    );
    if (!confirmed) return;

    try {
      await axios.delete(
        `${API}/api/subscriptions/plans/${id}`,
        authHeaders()
      );
      await fetchData();
    } catch (err) {
      console.error("Delete plan error:", err);
      alert(err.response?.data?.message || "Failed to delete plan");
    }
  };

  return (
    <div className="admin-subscriptions-page">
      <Header />

      <div className="as-layout">
        <AdminSidebar activeItem="subscriptions" />

        <main className="as-main">
          <div className="as-header card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                <div>
                  <span className="as-eyebrow">Admin Subscription Control</span>
                  <h2 className="as-title mb-2">Manage Vendor Subscription Plans</h2>
                  <p className="text-muted mb-0">
                    Review plan activity, compare usage, and manage subscription offerings across the marketplace.
                  </p>
                </div>
                <button className="as-create-btn" onClick={openCreateModal}>
                  <span className="material-symbols-outlined me-2">add</span>
                  Add New Plan
                </button>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm as-stat-card">
                <div className="card-body">
                  <div className="as-stat-label">Total Plans</div>
                  <div className="as-stat-value">{totalPlans}</div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm as-stat-card">
                <div className="card-body">
                  <div className="as-stat-label">Subscribed Vendors</div>
                  <div className="as-stat-value">{totalVendors}</div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm as-stat-card">
                <div className="card-body">
                  <div className="as-stat-label">Pro Vendors</div>
                  <div className="as-stat-value text-warning">{proVendors}</div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm as-stat-card">
                <div className="card-body">
                  <div className="as-stat-label">Premium Vendors</div>
                  <div className="as-stat-value text-danger">{premiumVendors}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm as-table-card mt-4">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
                <div>
                  <h5 className="mb-1">Subscription Plans</h5>
                  <p className="text-muted mb-0 small">
                    Search, review, and manage all available vendor plans.
                  </p>
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
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle as-table mb-0">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Price</th>
                        <th>Features</th>
                        <th>Vendors</th>
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
                                style={{ backgroundColor: getPlanColor(plan.slug) }}
                              />
                              <div>
                                <div className="fw-bold">{plan.name}</div>
                                <div className="text-muted small">{plan.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="fw-semibold">{formatPrice(plan)}</td>
                          <td className="text-muted">
                            {Array.isArray(plan.features)
                              ? plan.features.join(", ")
                              : "-"}
                          </td>
                          <td>{planVendorCounts[plan._id] || 0}</td>
                          <td>
                            <span className={`as-status ${plan.status.toLowerCase()}`}>
                              {plan.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-secondary me-2"
                              onClick={() => openEditModal(plan)}
                            >
                              Edit
                            </button>

                            {plan.status === "active" ? (
                              <button
                                className="btn btn-sm as-manage-btn me-2"
                                onClick={() => handleDeactivate(plan._id)}
                              >
                                Deactivate
                              </button>
                            ) : null}

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(plan._id)}
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

              {!loading && filteredPlans.length === 0 && (
                <div className="as-empty">No subscription plans found.</div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="as-modal-backdrop">
          <div className="as-modal card border-0 shadow">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  {editingPlanId ? "Edit Subscription Plan" : "Create Subscription Plan"}
                </h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={closeModal}>
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Plan Name</label>
                    <select
                      name="name"
                      className="form-select"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select plan</option>
                      <option value="Basic">Basic</option>
                      <option value="Pro">Pro</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Slug</label>
                    <select
                      name="slug"
                      className="form-select"
                      value={formData.slug}
                      onChange={handleChange}
                      required
                    >
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
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeModal}
                  >
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
    </div>
  );
};

export default AdminSubscriptions;