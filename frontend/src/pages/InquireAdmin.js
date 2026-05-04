import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/header";
import CustomerSidebar from "../components/CustomerSidebar";
import "./InquireAdmin.css";

const API = "http://localhost:5000";

const InquireAdmin = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState({
    full_name: "Loading...",
    email: "..."
  });

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  }, [navigate]);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchProfile = useCallback(async () => {
    try {
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get(`${API}/api/auth/profile`, authHeaders);
      setUser({
        full_name: res.data.full_name,
        email: res.data.email
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
      if (err.response?.status === 401) handleLogout();
    }
  }, [token, navigate, handleLogout]);

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/inquiries/my`, authHeaders);
      setInquiries(res.data || []);
    } catch (err) {
      console.error("Inquiry fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    fetchInquiries();
  }, [fetchProfile, fetchInquiries]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return alert("Please enter your message.");

    try {
      setSubmitting(true);
      await axios.post(
        `${API}/api/inquiries`,
        {
          subject: subject.trim(),
          message: message.trim()
        },
        authHeaders
      );

      setSubject("");
      setMessage("");
      fetchInquiries();
    } catch (err) {
      console.error("Submit inquiry error:", err);
      alert(err.response?.data?.message || "Failed to submit inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="inquire-page">
      <Header />

      <div className="inquire-layout">
        <CustomerSidebar
          user={user}
          handleLogout={handleLogout}
          activeItem="inquire"
        />

        <main className="inquire-main">
          <div className="inquire-header">
            <h2>Inquire Admin</h2>
            <p>Send a message to the admin team and review their replies here.</p>
          </div>

          <div className="inquire-grid">
            <section className="inquire-card">
              <h4 className="mb-3">Submit a message</h4>

              <form onSubmit={handleSubmit} className="inquire-form">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Subject (optional)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                <textarea
                  className="form-control"
                  rows="6"
                  placeholder="Write your message to admin..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                <button
                  type="submit"
                  className="inquire-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Inquiry"}
                </button>
              </form>
            </section>

            <section className="inquire-card">
              <h4 className="mb-3">Previous inquiries</h4>

              {loading ? (
                <div className="text-muted">Loading inquiries...</div>
              ) : inquiries.length === 0 ? (
                <div className="inquire-empty">No inquiries submitted yet.</div>
              ) : (
                <div className="inquire-list">
                  {inquiries.map((item) => (
                    <div className="inquire-item" key={item._id}>
                      <div className="inquire-item-top">
                        <div>
                          <h5>{item.subject || "General Inquiry"}</h5>
                          <span className={`status-badge ${item.status}`}>
                            {item.status}
                          </span>
                        </div>
                        <small>
                          {new Date(item.createdAt).toLocaleString()}
                        </small>
                      </div>

                      <p className="inquire-message">
                        <strong>You:</strong> {item.message}
                      </p>

                      {item.adminReply ? (
                        <div className="admin-reply-box">
                          <strong>Admin Reply:</strong>
                          <p>{item.adminReply}</p>
                          {item.repliedAt && (
                            <small>
                              Replied on{" "}
                              {new Date(item.repliedAt).toLocaleString()}
                            </small>
                          )}
                        </div>
                      ) : (
                        <div className="pending-reply">Waiting for admin reply.</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InquireAdmin;