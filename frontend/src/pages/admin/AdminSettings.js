import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import "./styles/AdminSettings.css";

const API = "http://localhost:5000";

const initialProfileForm = {
  full_name: "",
  phone: "",
  address: "",
};

const initialSecurityForm = {
  email: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const initialNewAdminForm = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const AdminSettings = () => {
  const token = localStorage.getItem("token");

  const [admin, setAdmin] = useState({
    full_name: "Loading...",
    email: "...",
    profile_image: "",
  });

  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [originalProfileForm, setOriginalProfileForm] = useState(initialProfileForm);
  const [securityForm, setSecurityForm] = useState(initialSecurityForm);
  const [newAdminForm, setNewAdminForm] = useState(initialNewAdminForm);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) {
          window.location.href = "/admin/login";
          return;
        }

        const res = await axios.get(`${API}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.role !== "admin") {
          window.location.href = "/admin/login";
          return;
        }

        setAdmin({
          full_name: res.data.full_name || "",
          email: res.data.email || "",
          profile_image: res.data.profile_image || "",
        });

        setProfileForm({
          full_name: res.data.full_name || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
        });

        setOriginalProfileForm({
          full_name: res.data.full_name || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
        });

        setSecurityForm((prev) => ({
          ...prev,
          email: res.data.email || "",
        }));
      } catch (err) {
        console.error("Admin settings load error:", err);
        window.location.href = "/admin/login";
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewAdminChange = (e) => {
    const { name, value } = e.target;
    setNewAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);

      const res = await axios.put(`${API}/api/auth/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = res.data.user;

      setAdmin((prev) => ({
        ...prev,
        full_name: updatedUser.full_name,
      }));

      setProfileForm({
        full_name: updatedUser.full_name || "",
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
      });

      setOriginalProfileForm({
        full_name: updatedUser.full_name || "",
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
      });

      setMessage({ type: "success", text: "Admin profile updated successfully." });
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSecuritySave = async (e) => {
    e.preventDefault();

    try {
      setSavingSecurity(true);

      const res = await axios.put(`${API}/api/auth/account`, securityForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAdmin((prev) => ({
        ...prev,
        email: res.data.user.email,
      }));

      setSecurityForm({
        email: res.data.user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage({ type: "success", text: "Admin security updated successfully." });
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to update security.",
      });
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (newAdminForm.password !== newAdminForm.confirmPassword) {
      setMessage({ type: "danger", text: "New admin passwords do not match." });
      return;
    }

    try {
      setCreatingAdmin(true);

      const res = await axios.post(
        `${API}/api/admin/create-admin`,
        {
          full_name: newAdminForm.full_name,
          email: newAdminForm.email,
          phone: newAdminForm.phone,
          password: newAdminForm.password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNewAdminForm(initialNewAdminForm);
      setMessage({
        type: "success",
        text: res.data.message || "New admin created successfully.",
      });
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to create new admin.",
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleCancel = () => {
    setProfileForm(originalProfileForm);
    setSecurityForm((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    setNewAdminForm(initialNewAdminForm);
    setMessage({ type: "secondary", text: "Changes discarded." });
  };

  if (loading) return <div className="ads-loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <AdminHeader admin={admin} />

      <div className="admin-layout">
        <AdminSidebar activeItem="settings" />

        <main className="admin-main">
          <div className="ads-page">
            <div className="ads-head">
              <div>
                <p>Admin Settings</p>
                <h2>Profile, Security & Admin Access</h2>
                <span>Manage your admin account details and create new admin users.</span>
              </div>
            </div>

            {message.text && <div className={`ads-msg ${message.type}`}>{message.text}</div>}

            <div className="ads-grid">
              <div className="ads-col">
                <form className="ads-card" onSubmit={handleProfileSave}>
                  <div className="ads-card-top">
                    <h4>Admin Profile</h4>
                  </div>

                  <div className="ads-form-grid">
                    <div>
                      <label>Full Name *</label>
                      <input
                        name="full_name"
                        value={profileForm.full_name}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>

                    <div>
                      <label>Phone *</label>
                      <input
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label>Address</label>
                    <textarea
                      name="address"
                      rows="3"
                      value={profileForm.address}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="ads-actions">
                    <button type="button" className="btn-light" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-main" disabled={savingProfile}>
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </form>

                <form className="ads-card" onSubmit={handleSecuritySave}>
                  <div className="ads-card-top">
                    <h4>Login & Security</h4>
                  </div>

                  <div>
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={securityForm.email}
                      onChange={handleSecurityChange}
                      required
                    />
                  </div>

                  <div>
                    <label>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={securityForm.currentPassword}
                      onChange={handleSecurityChange}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="ads-form-grid">
                    <div>
                      <label>New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={securityForm.newPassword}
                        onChange={handleSecurityChange}
                        placeholder="New password"
                      />
                    </div>

                    <div>
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={securityForm.confirmPassword}
                        onChange={handleSecurityChange}
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-main full" disabled={savingSecurity}>
                    {savingSecurity ? "Updating..." : "Update Security"}
                  </button>
                </form>
              </div>

              <div className="ads-col">
                <form className="ads-card" onSubmit={handleCreateAdmin}>
                  <div className="ads-card-top">
                    <h4>Create New Admin</h4>
                  </div>

                  <div className="ads-form-grid">
                    <div>
                      <label>Full Name *</label>
                      <input
                        name="full_name"
                        value={newAdminForm.full_name}
                        onChange={handleNewAdminChange}
                        required
                      />
                    </div>

                    <div>
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={newAdminForm.email}
                        onChange={handleNewAdminChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label>Phone *</label>
                    <input
                      name="phone"
                      value={newAdminForm.phone}
                      onChange={handleNewAdminChange}
                      required
                    />
                  </div>

                  <div className="ads-form-grid">
                    <div>
                      <label>Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={newAdminForm.password}
                        onChange={handleNewAdminChange}
                        required
                      />
                    </div>

                    <div>
                      <label>Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={newAdminForm.confirmPassword}
                        onChange={handleNewAdminChange}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-main full" disabled={creatingAdmin}>
                    {creatingAdmin ? "Creating..." : "Create Admin"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;