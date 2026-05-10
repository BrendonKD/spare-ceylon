import React, { useEffect, useState } from "react";
import "./styles/CustomerProfileSettings.css";
import Header from "../components/header";
import CustomerSidebar from "../components/CustomerSidebar";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

const CustomerProfileSettings = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [customer, setCustomer] = useState({
        full_name: "Loading...",
        email: "...",
        profile_image: ""
    });

    const [profileForm, setProfileForm] = useState(initialProfileForm);
    const [originalProfileForm, setOriginalProfileForm] = useState(initialProfileForm);
    const [securityForm, setSecurityForm] = useState(initialSecurityForm);

    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingSecurity, setSavingSecurity] = useState(false);

    const [files, setFiles] = useState({ profile_image: null });
    const [previewImage, setPreviewImage] = useState("");

    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${API}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data.role !== "customer") {
                    navigate("/login");
                    return;
                }

                const normalizedProfileImage = res.data.profile_image
                    ? `${API}/${res.data.profile_image.replace(/^\/+/, "")}`
                    : "";

                setCustomer({
                    full_name: res.data.full_name || "",
                    email: res.data.email || "",
                    profile_image: normalizedProfileImage,
                });

                setSecurityForm((prev) => ({
                    ...prev,
                    email: res.data.email || "",
                }));

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
            } catch (err) {
                console.error(err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate, token]);

    useEffect(() => {
        return () => {
            if (previewImage?.startsWith("blob:")) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    const fileUrl = (path) => {
        if (!path) return "";
        if (path.startsWith("blob:") || path.startsWith("http")) return path;
        return `${API}/${path.replace(/^\/+/, "")}`;
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSecurityChange = (e) => {
        const { name, value } = e.target;
        setSecurityForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFiles((prev) => ({ ...prev, profile_image: file }));

        if (previewImage?.startsWith("blob:")) {
            URL.revokeObjectURL(previewImage);
        }

        if (file.type.startsWith("image/")) {
            const preview = URL.createObjectURL(file);
            setPreviewImage(preview);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();

        try {
            setSavingProfile(true);

            const payload = new FormData();
            Object.entries(profileForm).forEach(([k, v]) => payload.append(k, v));

            if (files.profile_image) {
                payload.append("profile_image", files.profile_image);
            }

            const res = await axios.put(`${API}/api/auth/profile`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            const updatedUser = res.data.user;

            const normalizedProfileImage = updatedUser.profile_image
                ? `${API}/${updatedUser.profile_image.replace(/^\/+/, "")}`
                : "";

            setCustomer({
                full_name: updatedUser.full_name || "",
                email: updatedUser.email || "",
                profile_image: normalizedProfileImage,
            });

            const updatedProfileForm = {
                full_name: updatedUser.full_name || "",
                phone: updatedUser.phone || "",
                address: updatedUser.address || "",
            };

            setProfileForm(updatedProfileForm);
            setOriginalProfileForm(updatedProfileForm);
            setFiles({ profile_image: null });
            setPreviewImage("");

            setMessage({ type: "success", text: "Profile updated successfully." });
        } catch (error) {
            setMessage({
                type: "danger",
                text: error?.response?.data?.message || "Failed to update profile.",
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

            setCustomer((prev) => ({
                ...prev,
                email: res.data.user.email
            }));

            setSecurityForm((prev) => ({
                ...prev,
                email: res.data.user.email,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            }));

            setMessage({ type: "success", text: "Security details updated." });
        } catch (error) {
            setMessage({
                type: "danger",
                text: error?.response?.data?.message || "Failed to update security.",
            });
        } finally {
            setSavingSecurity(false);
        }
    };

    const handleCancel = () => {
        setProfileForm(originalProfileForm);
        setFiles({ profile_image: null });

        if (previewImage?.startsWith("blob:")) {
            URL.revokeObjectURL(previewImage);
        }
        setPreviewImage("");

        setSecurityForm((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        }));

        setMessage({ type: "secondary", text: "Changes discarded." });
    };

    if (loading) return <div className="cps-loading">Loading...</div>;

    return (
        <div className="customer-dashboard">
            <Header />

            <div className="cd-layout">
                <CustomerSidebar
                    user={customer}
                    handleLogout={handleLogout}
                    activeItem="settings"
                />

                <main className="cd-main">
                    <div className="cps">
                        <div className="cps-head">
                            <div>
                                <p>Customer Settings</p>
                                <h2>Profile & Security</h2>
                                <span>Update your personal details and login settings.</span>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`cps-msg ${message.type}`}>{message.text}</div>
                        )}

                        <div className="cps-grid">
                            <form className="cps-col" onSubmit={handleProfileSave}>
                                <section className="cps-card">
                                    <div className="cps-card-top">
                                        <h4>Profile Information</h4>
                                    </div>

                                    <div className="cps-profile-row">
                                        <div className="cps-profile-box">
                                            {previewImage || customer.profile_image ? (
                                                <img
                                                    src={previewImage || fileUrl(customer.profile_image)}
                                                    alt="Profile"
                                                    className="cps-profile-img"
                                                />
                                            ) : (
                                                <div className="cps-upload-body">Upload Photo</div>
                                            )}
                                        </div>

                                        <div className="cps-grow">
                                            <label>Profile Photo</label>
                                            <input
                                                type="file"
                                                name="profile_image"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            <small>PNG or JPG, max 2MB.</small>
                                        </div>
                                    </div>

                                    <div className="cps-form-grid">
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
                                        <label>Address (Optional)</label>
                                        <textarea
                                            name="address"
                                            rows="3"
                                            value={profileForm.address}
                                            onChange={handleProfileChange}
                                        />
                                    </div>

                                    <div className="cps-actions">
                                        <button type="button" className="btn-light" onClick={handleCancel}>
                                            Cancel
                                        </button>

                                        <button type="submit" className="btn-main" disabled={savingProfile}>
                                            {savingProfile ? "Saving..." : "Save Profile"}
                                        </button>
                                    </div>
                                </section>
                            </form>

                            <div className="cps-col">
                                <form className="cps-card" onSubmit={handleSecuritySave}>
                                    <div className="cps-card-top">
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

                                    <div className="cps-form-grid">
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

                                    <button
                                        type="submit"
                                        className="btn-main full"
                                        disabled={savingSecurity}
                                    >
                                        {savingSecurity ? "Updating..." : "Update Security"}
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

export default CustomerProfileSettings;