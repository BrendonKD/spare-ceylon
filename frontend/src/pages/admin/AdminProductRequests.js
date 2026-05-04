import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminProductRequests.css";
import AdminHeader from "../admin/components/AdminHeader";
import AdminSidebar from "../admin/components/AdminSidebar";

const API = "http://localhost:5000";

const AdminProductRequests = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const [actionModal, setActionModal] = useState({
    open: false,
    type: null,
    item: null
  });

  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "admin") {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (search.trim()) {
        params.append("q", search.trim());
      }

      const { data } = await axios.get(
        `${API}/api/product-requests?${params.toString()}`,
        { headers }
      );

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch product requests error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]); // eslint-disable-line

  useEffect(() => {
    const delay = setTimeout(fetchRequests, 300);
    return () => clearTimeout(delay);
  }, [fetchRequests]);

  const openActionModal = (type, item) => {
    setActionModal({ open: true, type, item });
    setAdminNotes("");
  };

  const closeActionModal = () => {
    setActionModal({ open: false, type: null, item: null });
    setAdminNotes("");
  };

  const handleApproveReject = async () => {
    if (!actionModal.item?._id || !actionModal.type) return;

    setSubmitting(true);
    try {
      const endpoint =
        actionModal.type === "approve"
          ? `${API}/api/product-requests/${actionModal.item._id}/approve`
          : `${API}/api/product-requests/${actionModal.item._id}/reject`;

      await axios.put(
        endpoint,
        { admin_note: adminNotes },
        { headers }
      );

      closeActionModal();
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length
    };
  }, [requests]);

  const getStatusClass = (status) => {
    if (status === "approved") return "apr-badge apr-approved";
    if (status === "rejected") return "apr-badge apr-rejected";
    return "apr-badge apr-pending";
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader onLogout={handleLogout} />

      <div className="ad-layout">
        <AdminSidebar activeItem="product-requests" />

        <main className="ad-main">
          <div className="apr-page-header">
            <div>
              <h4 className="apr-page-title">Product Requests</h4>
              <p className="apr-page-sub">
                Review vendor-submitted product type requests and grow the master catalog.
              </p>
            </div>
          </div>

          <div className="apr-stats-row">
            <div className="apr-stat">
              <div className="apr-stat-icon apr-total">
                <span className="material-symbols-outlined">inbox</span>
              </div>
              <div>
                <div className="apr-stat-val">{stats.total}</div>
                <div className="apr-stat-lbl">Visible Requests</div>
              </div>
            </div>

            <div className="apr-stat">
              <div className="apr-stat-icon apr-pending-icon">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <div className="apr-stat-val">{stats.pending}</div>
                <div className="apr-stat-lbl">Pending</div>
              </div>
            </div>

            <div className="apr-stat">
              <div className="apr-stat-icon apr-approved-icon">
                <span className="material-symbols-outlined">task_alt</span>
              </div>
              <div>
                <div className="apr-stat-val">{stats.approved}</div>
                <div className="apr-stat-lbl">Approved</div>
              </div>
            </div>

            <div className="apr-stat">
              <div className="apr-stat-icon apr-rejected-icon">
                <span className="material-symbols-outlined">cancel</span>
              </div>
              <div>
                <div className="apr-stat-val">{stats.rejected}</div>
                <div className="apr-stat-lbl">Rejected</div>
              </div>
            </div>
          </div>

          <div className="ad-card">
            <div className="apr-toolbar">
              <div className="apr-search-wrap">
                <span className="material-symbols-outlined apr-search-icon">search</span>
                <input
                  type="text"
                  className="apr-search-input"
                  placeholder="Search by product type, description, or vendor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="apr-clear-btn"
                    onClick={() => setSearch("")}
                    type="button"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>

              <select
                className="form-select apr-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>

            {loading ? (
              <div className="apr-center">
                <div className="spinner-border text-success" />
                <p className="mt-3 text-muted small">Loading product requests…</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="apr-center">
                <span className="material-symbols-outlined apr-empty-icon">inventory_2</span>
                <p className="text-muted small mt-2">No product requests found.</p>
              </div>
            ) : (
              <div className="apr-table-wrap">
                <table className="table table-hover apr-table mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Requested Product Type</th>
                      <th>Vendor</th>
                      <th>Status</th>
                      <th>Requested On</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((item, index) => (
                      <tr key={item._id}>
                        <td className="apr-td-num">{index + 1}</td>

                        <td>
                          <div className="apr-product-name">{item.name}</div>
                          <div className="apr-product-desc">
                            {item.description || "—"}
                          </div>
                        </td>

                        <td>
                          <div className="apr-vendor-name">
                            {item.vendor_id?.full_name || "Unknown Vendor"}
                          </div>
                          <div className="apr-vendor-email">
                            {item.vendor_id?.email || "—"}
                          </div>
                        </td>

                        <td>
                          <span className={getStatusClass(item.status)}>
                            <span className="material-symbols-outlined apr-badge-icon">
                              {item.status === "approved"
                                ? "task_alt"
                                : item.status === "rejected"
                                ? "cancel"
                                : "schedule"}
                            </span>
                            {item.status}
                          </span>

                          {item.admin_note && (
                            <div className="apr-admin-note">
                              Note: {item.admin_note}
                            </div>
                          )}

                          {item.approved_product_id && (
                            <div className="apr-linked-product">
                              Linked: {item.approved_product_id.name}
                            </div>
                          )}
                        </td>

                        <td className="text-muted small">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>

                        <td className="text-end">
                          {item.status === "pending" ? (
                            <div className="apr-actions">
                              <button
                                className="apr-action-btn apr-approve"
                                onClick={() => openActionModal("approve", item)}
                                title="Approve"
                              >
                                <span className="material-symbols-outlined">task_alt</span>
                              </button>
                              <button
                                className="apr-action-btn apr-reject"
                                onClick={() => openActionModal("reject", item)}
                                title="Reject"
                              >
                                <span className="material-symbols-outlined">close</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">Processed</span>
                          )}
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

      {actionModal.open && (
        <div className="apr-modal-backdrop" onClick={closeActionModal}>
          <div className="apr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apr-modal-header">
              <h6 className="apr-modal-title">
                <span className="material-symbols-outlined">
                  {actionModal.type === "approve" ? "task_alt" : "warning"}
                </span>
                {actionModal.type === "approve"
                  ? "Approve Product Request"
                  : "Reject Product Request"}
              </h6>
              <button className="apr-modal-close" onClick={closeActionModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="apr-modal-body">
              <div className="apr-summary-card">
                <div className="apr-summary-title">{actionModal.item?.name}</div>
                <div className="apr-summary-meta">
                  Vendor: {actionModal.item?.vendor_id?.full_name || "Unknown"}
                </div>
                <div className="apr-summary-meta">
                  {actionModal.item?.description || "No description provided"}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label apr-label">Admin Note</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder={
                    actionModal.type === "approve"
                      ? "Optional note for approval..."
                      : "Reason for rejection..."
                  }
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="apr-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={closeActionModal}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className={
                    actionModal.type === "approve"
                      ? "apr-confirm-btn apr-confirm-approve"
                      : "apr-confirm-btn apr-confirm-reject"
                  }
                  onClick={handleApproveReject}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">
                        {actionModal.type === "approve" ? "task_alt" : "delete"}
                      </span>
                      {actionModal.type === "approve" ? "Approve" : "Reject"}
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

export default AdminProductRequests;