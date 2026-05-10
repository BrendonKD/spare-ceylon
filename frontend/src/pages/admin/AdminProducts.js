import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/AdminProducts.css";
import AdminHeader from "../admin/components/AdminHeader";
import AdminSidebar from "../admin/components/AdminSidebar";

const API = "http://localhost:5000";

const EMPTY_FORM = { name: "", description: "" };

const AdminProducts = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "admin") {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, requestsRes] = await Promise.all([
        axios.get(`${API}/api/products?q=${encodeURIComponent(search)}&limit=100`, { headers }),
        axios.get(`${API}/api/product-requests`, { headers })
      ]);

      setProducts(productsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const delay = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delay);
  }, [fetchProducts]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditItem(product);
    setForm({
      name: product.name || "",
      description: product.description || ""
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Product type name is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editItem) {
        await axios.put(`${API}/api/products/${editItem._id}`, form, { headers });
      } else {
        await axios.post(`${API}/api/products`, form, { headers });
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/api/products/${deleteId}`, { headers });
      setDeleteId(null);
      fetchProducts();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`${API}/api/product-requests/${id}/approve`, {}, { headers });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Approve failed.");
    }
  };

  const handleReject = async (id) => {
    const admin_note = window.prompt("Reason for rejection (optional):") || "";
    try {
      await axios.put(`${API}/api/product-requests/${id}/reject`, { admin_note }, { headers });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Reject failed.");
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="admin-dashboard">
      <AdminHeader onLogout={handleLogout} />

      <div className="ad-layout">
        <AdminSidebar activeItem="products" />

        <main className="ad-main">
          <div className="ap-page-header">
            <div>
              <h4 className="ap-page-title">Product Types</h4>
              <p className="ap-page-sub">
                Manage reusable master product types for vendor listings.
              </p>
            </div>
            <button className="ap-add-btn" onClick={openAdd}>
              <span className="material-symbols-outlined">add</span>
              Add Product Type
            </button>
          </div>

          <div className="ap-stats-row">
            <div className="ap-stat">
              <div className="ap-stat-val">{products.length}</div>
              <div className="ap-stat-lbl">Total Product Types</div>
            </div>
            <div className="ap-stat">
              <div className="ap-stat-val">{pendingRequests.length}</div>
              <div className="ap-stat-lbl">Pending Requests</div>
            </div>
            <div className="ap-stat">
              <div className="ap-stat-val">{requests.filter((r) => r.status === "approved").length}</div>
              <div className="ap-stat-lbl">Approved Requests</div>
            </div>
          </div>

          {pendingRequests.length > 0 && (
            <div className="ad-card mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Pending Product Requests</h6>
                <span className="ap-count">{pendingRequests.length} pending</span>
              </div>

              <div className="ap-table-wrap">
                <table className="table table-hover ap-table mb-0">
                  <thead>
                    <tr>
                      <th>Requested Product Type</th>
                      <th>Vendor</th>
                      <th>Description</th>
                      <th>Requested At</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((r) => (
                      <tr key={r._id}>
                        <td>{r.name}</td>
                        <td>
                          {r.vendor_id?.full_name || "Vendor"}<br />
                          <span className="text-muted small">{r.vendor_id?.email || ""}</span>
                        </td>
                        <td>{r.description || <span className="text-muted small">—</span>}</td>
                        <td className="text-muted small">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleApprove(r._id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleReject(r._id)}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="ad-card">
            <div className="ap-search-row">
              <div className="ap-search-wrap">
                <span className="material-symbols-outlined ap-search-icon">search</span>
                <input
                  type="text"
                  className="ap-search-input"
                  placeholder="Search by product type name or description…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="ap-search-clear" onClick={() => setSearch("")}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
              <span className="ap-count">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div className="ap-center">
                <div className="spinner-border text-success" />
                <p className="mt-3 text-muted small">Loading product types…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ap-center">
                <span className="material-symbols-outlined ap-empty-icon">
                  inventory_2
                </span>
                <p className="text-muted small mt-2">
                  {search
                    ? `No results for "${search}"`
                    : "No product types yet. Add one to get started."}
                </p>
              </div>
            ) : (
              <div className="ap-table-wrap">
                <table className="table table-hover ap-table mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Type Name</th>
                      <th>Description</th>
                      <th>Total Listings</th>
                      <th>Added On</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => (
                      <tr key={p._id}>
                        <td className="ap-td-num">{i + 1}</td>
                        <td>
                          <div className="ap-product-name">{p.name}</div>
                        </td>
                        <td>
                          <span className="ap-desc-text">
                            {p.description || <span className="text-muted small">—</span>}
                          </span>
                        </td>
                        <td>
                        <span className="ap-listing-count-badge">
                          {p.listingCount || 0}
                        </span>
                      </td>
                        <td className="text-muted small">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="text-end">
                          <button
                            className="ap-action-btn ap-view"
                            onClick={() => navigate(`/admin/products/${p._id}/listings`)}
                            title="View Available Listings"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button
                            className="ap-action-btn ap-edit"
                            onClick={() => openEdit(p)}
                            title="Edit"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="ap-action-btn ap-delete"
                            onClick={() => setDeleteId(p._id)}
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="ap-modal-backdrop" onClick={closeModal}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h6 className="ap-modal-title">
                <span className="material-symbols-outlined">
                  {editItem ? "edit" : "add_circle"}
                </span>
                {editItem ? "Edit Product Type" : "Add New Product Type"}
              </h6>
              <button className="ap-modal-close" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="ap-modal-body">
              {formError && (
                <div className="alert alert-danger py-2 small">{formError}</div>
              )}

              <div className="mb-3">
                <label className="form-label ap-label">
                  Product Type Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Brake Pad Set"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="form-label ap-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Brief description of this product type…"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="ap-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="ap-save-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      {editItem ? "Save Changes" : "Add Product Type"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="ap-modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="ap-modal ap-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h6 className="ap-modal-title">
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#be123c" }}
                >
                  warning
                </span>
                Confirm Delete
              </h6>
            </div>
            <div className="ap-modal-body">
              <p className="text-muted small mb-4">
                This product type will be permanently deleted. Existing vendor listings that already
                reference it may lose their master product link.
              </p>
              <div className="ap-modal-footer">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="ap-delete-confirm-btn"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">delete</span>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;