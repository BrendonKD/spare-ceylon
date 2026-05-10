import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/header";
import CustomerSidebar from "../components/CustomerSidebar";
import "./styles/InquireAdmin.css";

const API = "http://localhost:5000";

const InquireAdmin = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState({
    full_name: "Loading...",
    email: "...",
    profile_image: ""
  });

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({
    subject: "",
    message: ""
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const authHeaders = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` }
    }),
    [token]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/", { replace: true });
  }, [navigate]);

  const validateForm = () => {
    const errors = {
      subject: "",
      message: ""
    };

    let isValid = true;

    if (!message.trim()) {
      errors.message = "Please enter your message.";
      isValid = false;
    } else if (message.trim().length < 10) {
      errors.message = "Message should be at least 10 characters.";
      isValid = false;
    }

    if (subject.trim().length > 100) {
      errors.subject = "Subject must be under 100 characters.";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/auth/profile`, authHeaders);
      setUser({
        full_name: res.data.full_name,
        email: res.data.email,
        profile_image: res.data.profile_image
          ? `${API}/${res.data.profile_image.replace(/^\/+/, "")}`
          : ""
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setFormError("Unable to load your profile right now.");
      }
    }
  }, [authHeaders, handleLogout]);

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      setFormError("");

      const res = await axios.get(`${API}/api/inquiries/my`, authHeaders);
      setInquiries(res.data || []);
    } catch (err) {
      console.error("Inquiry fetch error:", err);

      if (err.response?.status === 401) {
        handleLogout();
      } else if (err.response) {
        setFormError(err.response.data?.message || "Failed to load inquiries.");
      } else {
        setFormError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [authHeaders, handleLogout]);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      await fetchProfile();
      await fetchInquiries();
    };

    run();
  }, [token, navigate, fetchProfile, fetchInquiries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!validateForm()) return;

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
      setFieldErrors({ subject: "", message: "" });
      setSuccessMessage("Inquiry submitted successfully.");
      fetchInquiries();
    } catch (err) {
      console.error("Submit inquiry error:", err);

      if (err.response?.status === 401) {
        handleLogout();
      } else if (err.response) {
        setFormError(err.response.data?.message || "Failed to submit inquiry.");
      } else {
        setFormError("Network error. Please try again.");
      }
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

          {formError && (
            <div className="alert alert-danger inquire-alert" role="alert">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success inquire-alert" role="alert">
              {successMessage}
            </div>
          )}

          <div className="inquire-grid">
            <section className="inquire-card">
              <h4 className="mb-3">Submit a message</h4>

              <form onSubmit={handleSubmit} className="inquire-form" noValidate>
                <div>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors.subject ? "is-invalid" : ""}`}
                    placeholder="Subject (optional)"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      if (fieldErrors.subject) {
                        setFieldErrors((prev) => ({ ...prev, subject: "" }));
                      }
                    }}
                  />
                  {fieldErrors.subject && (
                    <div className="invalid-feedback d-block">{fieldErrors.subject}</div>
                  )}
                </div>

                <div>
                  <textarea
                    className={`form-control ${fieldErrors.message ? "is-invalid" : ""}`}
                    rows="6"
                    placeholder="Write your message to admin..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (fieldErrors.message) {
                        setFieldErrors((prev) => ({ ...prev, message: "" }));
                      }
                    }}
                  />
                  {fieldErrors.message && (
                    <div className="invalid-feedback d-block">{fieldErrors.message}</div>
                  )}
                </div>

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
                        <small>{new Date(item.createdAt).toLocaleString()}</small>
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
                              Replied on {new Date(item.repliedAt).toLocaleString()}
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