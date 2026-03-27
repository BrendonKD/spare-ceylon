import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminProducts.css";
import AdminHeader from "../admin/components/AdminHeader";
import AdminSidebar from "../admin/components/AdminSidebar";

const API = "http://localhost:5000";

const EMPTY_FORM = { name: "", description: "", oem_part_number: "" };

// ---------------------------------------------------------------------------
// AdminProducts
// ---------------------------------------------------------------------------
const AdminProducts = () => {
  const navigate  = useNavigate();
  const token     = localStorage.getItem("token");
  const headers   = { Authorization: `Bearer ${token}` };

  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState(null);   // null = add mode
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirm
  const [deleteId,  setDeleteId]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  // Guard
  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "admin") navigate("/admin/login");
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  // ── Fetch products ─────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API}/api/products?q=${encodeURIComponent(search)}&limit=100`,
        { headers }
      );
      setProducts(data);
    } catch (err) {
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
    }
  }, [search]); // eslint-disable-line

  useEffect(() => {
    const delay = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delay);
  }, [fetchProducts]);

  // ── Open modal ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditItem(product);
    setForm({
      name:            product.name            || "",
      description:     product.description     || "",
      oem_part_number: product.oem_part_number || ""
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormError(""); };

  // ── Save (add or edit) ─────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Product name is required."); return; }
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

  // ── Delete ─────────────────────────────────────────────────────────────
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

  // Filtered list (client-side instant filter on top of server search)
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.oem_part_number || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <AdminHeader onLogout={handleLogout} />

      <div className="ad-layout">
        <AdminSidebar activeItem="products" />

        <main className="ad-main">

          {/* ── Page Header ─────────────────────────────────── */}
          <div className="ap-page-header">
            <div>
              <h4 className="ap-page-title">Product Catalogue</h4>
              <p className="ap-page-sub">
                Manage the product types vendors can list on the platform.
              </p>
            </div>
            <button className="ap-add-btn" onClick={openAdd}>
              <span className="material-symbols-outlined">add</span>
              Add Product
            </button>
          </div>

          {/* ── Stats row ───────────────────────────────────── */}
          <div className="ap-stats-row">
            <div className="ap-stat">
              <div className="ap-stat-val">{products.length}</div>
              <div className="ap-stat-lbl">Total Products</div>
            </div>
            <div className="ap-stat">
              <div className="ap-stat-val">
                {products.filter((p) => p.oem_part_number).length}
              </div>
              <div className="ap-stat-lbl">With OEM Number</div>
            </div>
            <div className="ap-stat">
              <div className="ap-stat-val">
                {products.filter((p) => !p.oem_part_number).length}
              </div>
              <div className="ap-stat-lbl">Without OEM</div>
            </div>
          </div>

          {/* ── Search + Table card ──────────────────────────── */}
          <div className="ad-card">

            {/* Search bar */}
            <div className="ap-search-row">
              <div className="ap-search-wrap">
                <span className="material-symbols-outlined ap-search-icon">search</span>
                <input
                  type="text"
                  className="ap-search-input"
                  placeholder="Search by product name or OEM number…"
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

            {/* Table */}
            {loading ? (
              <div className="ap-center">
                <div className="spinner-border text-success" />
                <p className="mt-3 text-muted small">Loading products…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ap-center">
                <span className="material-symbols-outlined ap-empty-icon">
                  inventory_2
                </span>
                <p className="text-muted small mt-2">
                  {search ? `No results for "${search}"` : "No products yet. Add one to get started."}
                </p>
              </div>
            ) : (
              <div className="ap-table-wrap">
                <table className="table table-hover ap-table mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th>OEM Part Number</th>
                      <th>Description</th>
                      <th>Added</th>
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
                          {p.oem_part_number
                            ? <code className="ap-oem">{p.oem_part_number}</code>
                            : <span className="text-muted small">—</span>
                          }
                        </td>
                        <td>
                          <span className="ap-desc-text">
                            {p.description || <span className="text-muted small">—</span>}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="text-end">
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

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="ap-modal-backdrop" onClick={closeModal}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>

            <div className="ap-modal-header">
              <h6 className="ap-modal-title">
                <span className="material-symbols-outlined">
                  {editItem ? "edit" : "add_circle"}
                </span>
                {editItem ? "Edit Product" : "Add New Product"}
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
                  Product Name <span className="text-danger">*</span>
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

              <div className="mb-3">
                <label className="form-label ap-label">OEM Part Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 04465-0K060"
                  value={form.oem_part_number}
                  onChange={(e) => setForm((p) => ({ ...p, oem_part_number: e.target.value }))}
                />
                <div className="form-text">
                  Vendors and customers can search by this number.
                </div>
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
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="ap-save-btn" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                    : <><span className="material-symbols-outlined">save</span>{editItem ? "Save Changes" : "Add Product"}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────── */}
      {deleteId && (
        <div className="ap-modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="ap-modal ap-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h6 className="ap-modal-title">
                <span className="material-symbols-outlined" style={{ color: "#be123c" }}>warning</span>
                Confirm Delete
              </h6>
            </div>
            <div className="ap-modal-body">
              <p className="text-muted small mb-4">
                This product will be permanently deleted. Existing vendor listings linked
                to it will not be affected, but the product will no longer appear in searches.
              </p>
              <div className="ap-modal-footer">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setDeleteId(null)}>
                  Cancel
                </button>
                <button className="ap-delete-confirm-btn" onClick={handleDelete} disabled={deleting}>
                  {deleting
                    ? <><span className="spinner-border spinner-border-sm me-2" />Deleting…</>
                    : <><span className="material-symbols-outlined">delete</span>Delete</>
                  }
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