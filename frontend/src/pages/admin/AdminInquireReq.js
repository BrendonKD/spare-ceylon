import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import "./styles/AdminInquireReq.css";

const API = "http://localhost:5000";

const AdminInquireReq = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [admin, setAdmin] = useState({
    full_name: "Loading...",
    email: "..."
  });

  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const handleAdminLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/admin/login");
  }, [navigate]);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);

      const [profileRes, inquiryRes] = await Promise.all([
        axios.get(`${API}/api/auth/profile`, authHeaders),
        axios.get(`${API}/api/inquiries/admin`, authHeaders)
      ]);

      if (profileRes.data.role !== "admin") {
        handleAdminLogout();
        return;
      }

      setAdmin({
        full_name: profileRes.data.full_name,
        email: profileRes.data.email
      });

      const data = inquiryRes.data || [];
      setInquiries(data);

      if (data.length > 0 && !selectedInquiry) {
        setSelectedInquiry(data[0]);
        setReply(data[0].adminReply || "");
      }
    } catch (err) {
      console.error("Admin inquiry fetch error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAdminLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [selectedInquiry, handleAdminLogout]);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchInquiries();
  }, [fetchInquiries, token, navigate]);

  const handleSelect = (item) => {
    setSelectedInquiry(item);
    setReply(item.adminReply || "");
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedInquiry || !reply.trim()) return;

    try {
      setSending(true);

      const res = await axios.put(
        `${API}/api/inquiries/admin/${selectedInquiry._id}/reply`,
        { adminReply: reply.trim() },
        authHeaders
      );

      const updatedInquiry = res.data;

      setInquiries((prev) =>
        prev.map((item) =>
          item._id === updatedInquiry._id ? updatedInquiry : item
        )
      );

      setSelectedInquiry(updatedInquiry);
      setReply(updatedInquiry.adminReply || "");
    } catch (err) {
      console.error("Reply submit error:", err);
      alert(err.response?.data?.message || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader admin={admin} />

      <div className="admin-layout">
        <AdminSidebar activeItem="inquiries" />

        <main className="admin-main admin-inquiry-main">
          <div className="admin-inquiry-header">
            <h2>Customer Inquiries</h2>
            <p>Review customer messages</p>
          </div>

          <div className="admin-inquiry-shell">
            <aside className="admin-inquiry-list-panel">
              <h5 className="mb-3">Inquiry Requests</h5>

              {loading ? (
                <div className="text-muted">Loading inquiries...</div>
              ) : inquiries.length === 0 ? (
                <div className="text-muted">No customer inquiries yet.</div>
              ) : (
                <div className="admin-inquiry-list">
                  {inquiries.map((item) => (
                    <button
                      key={item._id}
                      className={`admin-inquiry-item ${
                        selectedInquiry?._id === item._id ? "active" : ""
                      }`}
                      onClick={() => handleSelect(item)}
                    >
                      <div className="admin-inquiry-item-head">
                        <span>{item.subject || "General Inquiry"}</span>
                        <small className={`status-badge ${item.status}`}>
                          {item.status}
                        </small>
                      </div>

                      <div className="admin-inquiry-item-user">
                        {item.customerId?.full_name || "Customer"}
                      </div>

                      <div className="admin-inquiry-item-preview">
                        {item.message}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="admin-inquiry-detail-panel">
              {!selectedInquiry ? (
                <div className="admin-inquiry-empty">
                  Select an inquiry to view details.
                </div>
              ) : (
                <>
                  <div className="admin-inquiry-detail-top">
                    <h4>{selectedInquiry.subject || "General Inquiry"}</h4>
                    <span className={`status-badge ${selectedInquiry.status}`}>
                      {selectedInquiry.status}
                    </span>
                  </div>

                  <div className="admin-inquiry-meta">
                    <p>
                      <strong>Customer:</strong>{" "}
                      {selectedInquiry.customerId?.full_name || "Customer"}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {selectedInquiry.customerId?.email || "No email"}
                    </p>
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(selectedInquiry.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="admin-inquiry-message-box">
                    <strong>Customer Message</strong>
                    <p>{selectedInquiry.message}</p>
                  </div>

                  <form onSubmit={handleReplySubmit} className="admin-reply-form">
                    <label className="form-label fw-semibold">Admin Reply</label>

                    <textarea
                      className="form-control"
                      rows="6"
                      placeholder="Write your reply to the customer..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />

                    <button
                      type="submit"
                      className="admin-reply-btn"
                      disabled={sending}
                    >
                      {sending ? "Sending..." : "Send Reply"}
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminInquireReq;