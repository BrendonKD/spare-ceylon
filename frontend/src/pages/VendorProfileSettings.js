import React, { useEffect, useState } from "react";
import "./VendorProfileSettings.css";
import Header from "../components/header";
import VendorSidebar from "../components/VendorSidebar";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

const initialVendorForm = {
    business_name: "",
    business_reg_no: "",
    address: "",
    description: "",
    logo_url: "",
    verification_badge_shown: false,
    nic_front_url: "",
    nic_back_url: "",
    br_certificate_url: "",
    registration_certificate_url: "",
    latitude: "",
    longitude: "",
    verification_status: "pending",
};

const initialSecurityForm = {
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

const VendorProfileSettings = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [vendor, setVendor] = useState({
        full_name: "Loading...",
        email: "...",
        business_name: "",
    });

    const [vendorForm, setVendorForm] = useState(initialVendorForm);
    const [originalVendorForm, setOriginalVendorForm] = useState(initialVendorForm);
    const [securityForm, setSecurityForm] = useState(initialSecurityForm);

    const [loading, setLoading] = useState(true);
    const [savingVendor, setSavingVendor] = useState(false);
    const [savingSecurity, setSavingSecurity] = useState(false);

    const [files, setFiles] = useState({
        logo: null,
        nic_front: null,
        nic_back: null,
        br_certificate: null,
        registration_certificate: null,
    });

    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchAll = async () => {
            try {
                const profileRes = await axios.get(`${API}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (profileRes.data.role !== "vendor") {
                    navigate("/login");
                    return;
                }

                setVendor({
                    full_name: profileRes.data.full_name,
                    email: profileRes.data.email,
                    business_name: profileRes.data.business_name || "",
                });

                setSecurityForm((prev) => ({
                    ...prev,
                    email: profileRes.data.email || "",
                }));

                const vendorRes = await axios.get(`${API}/api/vendors/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const v = vendorRes.data.vendor;

                const normalized = {
                    business_name: v.business_name || "",
                    business_reg_no: v.business_reg_no || "",
                    address: v.address || "",
                    description: v.description || "",
                    logo_url: v.logo_url || "",
                    verification_badge_shown: v.verification_badge_shown || false,
                    nic_front_url: v.nic_front_url || "",
                    nic_back_url: v.nic_back_url || "",
                    br_certificate_url: v.br_certificate_url || "",
                    registration_certificate_url: v.registration_certificate_url || "",
                    latitude: v.latitude ?? "",
                    longitude: v.longitude ?? "",
                    verification_status: v.verification_status || "pending",
                };

                setVendorForm(normalized);
                setOriginalVendorForm(normalized);
            } catch (err) {
                console.error(err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [navigate, token]);

    const fileUrl = (path) => {
        if (!path) return "";
        if (path.startsWith("blob:") || path.startsWith("http")) return path;
        return `${API}${path}`;
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleVendorChange = (e) => {
        const { name, value, checked, type } = e.target;
        setVendorForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSecurityChange = (e) => {
        const { name, value } = e.target;
        setSecurityForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (!selectedFiles?.[0]) return;

        const file = selectedFiles[0];
        setFiles((prev) => ({ ...prev, [name]: file }));

        if (file.type.startsWith("image/")) {
            const preview = URL.createObjectURL(file);
            setVendorForm((prev) => ({
                ...prev,
                [`${name}_url`]: preview,
            }));
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setMessage({ type: "danger", text: "Geolocation is not supported." });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setVendorForm((prev) => ({
                    ...prev,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                }));
                setMessage({ type: "success", text: "Location updated successfully." });
            },
            () => setMessage({ type: "danger", text: "Unable to get location." })
        );
    };

    const handleVendorSave = async (e) => {
        e.preventDefault();
        try {
            setSavingVendor(true);
            const payload = new FormData();

            Object.entries({
                business_name: vendorForm.business_name,
                business_reg_no: vendorForm.business_reg_no,
                address: vendorForm.address,
                description: vendorForm.description,
                verification_badge_shown: vendorForm.verification_badge_shown,
                latitude: vendorForm.latitude,
                longitude: vendorForm.longitude,
            }).forEach(([k, v]) => payload.append(k, v));

            Object.entries(files).forEach(([k, v]) => {
                if (v) payload.append(k, v);
            });

            const res = await axios.put(`${API}/api/vendors/me`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            setVendorForm((prev) => ({ ...prev, ...res.data.vendor }));
            setOriginalVendorForm((prev) => ({ ...prev, ...res.data.vendor }));
            setMessage({ type: "success", text: "Business details saved successfully." });
        } catch (error) {
            setMessage({
                type: "danger",
                text: error?.response?.data?.message || "Failed to save business details.",
            });
        } finally {
            setSavingVendor(false);
        }
    };

    const handleSecuritySave = async (e) => {
        e.preventDefault();
        try {
            setSavingSecurity(true);

            const res = await axios.put(
                `${API}/api/auth/account`,
                securityForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setVendor((prev) => ({ ...prev, email: res.data.user.email }));
            setSecurityForm((prev) => ({
                ...prev,
                email: res.data.user.email,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            }));

            setMessage({ type: "success", text: "Login details updated successfully." });
        } catch (error) {
            setMessage({
                type: "danger",
                text: error?.response?.data?.message || "Failed to update login details.",
            });
        } finally {
            setSavingSecurity(false);
        }
    };

    const handleCancel = () => {
        setVendorForm(originalVendorForm);
        setFiles({
            logo: null,
            nic_front: null,
            nic_back: null,
            br_certificate: null,
            registration_certificate: null,
        });
        setSecurityForm((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        }));
        setMessage({ type: "secondary", text: "Changes discarded." });
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm("This will permanently delete your account. Continue?");
        if (!confirmed) return;

        const doubleConfirm = window.prompt("Type DELETE to confirm");
        if (doubleConfirm !== "DELETE") return;

        try {
            await axios.delete(`${API}/api/vendors/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Vendor account deleted successfully.");
            navigate("/login");
        } catch (error) {
            setMessage({
                type: "danger",
                text: error?.response?.data?.message || "Failed to delete account.",
            });
        }
    };

    const UploadCard = ({ title, name, url }) => (
        <label className="vps-upload">
            <span className="vps-upload-title">{title}</span>
            <input hidden type="file" name={name} accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} />
            {url ? (
                url.endsWith(".pdf") ? <div className="vps-upload-body">PDF Uploaded</div> :
                    <img src={fileUrl(url)} alt={title} className="vps-doc-img" />
            ) : (
                <div className="vps-upload-body">Click to upload</div>
            )}
        </label>
    );

    return (
        <div className="vendor-dashboard">
            <Header />
            <div className="vd-layout">
                <VendorSidebar vendor={vendor} activeItem="settings" onLogout={handleLogout} />

                <main className="vd-main">
                    <div className="vps">
                        <div className="vps-head">
                            <div>
                                <p>Vendor Settings</p>
                                <h2>Profile & Security</h2>
                                <span>Manage business details, documents, location and login settings.</span>
                            </div>
                            <div className={`vps-badge ${vendorForm.verification_status}`}>
                                {vendorForm.verification_status}
                            </div>
                        </div>

                        {message.text && <div className={`vps-msg ${message.type}`}>{message.text}</div>}

                        {loading ? (
                            <div className="vps-card">Loading...</div>
                        ) : (
                            <div className="vps-grid">
                                <form className="vps-col" onSubmit={handleVendorSave}>
                                    <section className="vps-card">
                                        <div className="vps-card-top">
                                            <h4>Business Information</h4>
                                            <span className="pill">
                                                {vendorForm.verification_status === "verified" ? "Verified" : "Pending"}
                                            </span>
                                        </div>

                                        <div className="vps-logo-row">
                                            <div className="vps-logo-box">
                                                {vendorForm.logo_url ? (
                                                    <img src={fileUrl(vendorForm.logo_url)} alt="Logo" className="vps-doc-img" />
                                                ) : (
                                                    <div className="vps-upload-body">Upload Logo</div>
                                                )}
                                            </div>
                                            <div className="vps-grow">
                                                <label>Business Logo</label>
                                                <input type="file" name="logo" accept="image/*" onChange={handleFileChange} />
                                                <small>Square image, PNG or JPG.</small>
                                            </div>
                                        </div>

                                        <div className="vps-form-grid">
                                            <div>
                                                <label>Business Name *</label>
                                                <input name="business_name" value={vendorForm.business_name} onChange={handleVendorChange} required />
                                            </div>
                                            <div>
                                                <label>Business Registration No. *</label>
                                                <input name="business_reg_no" value={vendorForm.business_reg_no} onChange={handleVendorChange} required />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="vps-check">
                                                <input
                                                    type="checkbox"
                                                    name="verification_badge_shown"
                                                    checked={vendorForm.verification_badge_shown}
                                                    onChange={handleVendorChange}
                                                />
                                                <span>Show verification badge to customers</span>
                                            </label>
                                        </div>

                                        <div>
                                            <label>Business Address *</label>
                                            <textarea name="address" rows="3" value={vendorForm.address} onChange={handleVendorChange} required />
                                        </div>

                                        <div>
                                            <label>Business Description</label>
                                            <textarea name="description" rows="4" value={vendorForm.description} onChange={handleVendorChange} />
                                        </div>
                                    </section>

                                    <section className="vps-card">
                                        <div className="vps-card-top">
                                            <h4>Verification Documents</h4>
                                        </div>

                                        <div className="vps-upload-grid">
                                            <UploadCard title="NIC Front Side *" name="nic_front" url={vendorForm.nic_front_url} />
                                            <UploadCard title="NIC Back Side *" name="nic_back" url={vendorForm.nic_back_url} />
                                            <UploadCard title="Business Registration *" name="br_certificate" url={vendorForm.br_certificate_url} />
                                            <UploadCard title="Registration Certificate" name="registration_certificate" url={vendorForm.registration_certificate_url} />
                                        </div>
                                    </section>

                                    <div className="vps-actions">
                                        <button type="button" className="btn-light" onClick={handleCancel}>Cancel</button>
                                        <button type="submit" className="btn-main" disabled={savingVendor}>
                                            {savingVendor ? "Saving..." : "Save Business Details"}
                                        </button>
                                    </div>
                                </form>

                                <div className="vps-col">
                                    <section className="vps-card">
                                        <div className="vps-card-top">
                                            <h4>Business Location</h4>
                                        </div>

                                        <div className="vps-map">
                                            {vendorForm.latitude && vendorForm.longitude ? (
                                                <iframe
                                                    title="Vendor location"
                                                    src={`https://www.google.com/maps?q=${vendorForm.latitude},${vendorForm.longitude}&z=15&output=embed`}
                                                />
                                            ) : (
                                                <div className="vps-upload-body">Location not set</div>
                                            )}
                                        </div>

                                        <div className="vps-form-grid">
                                            <div>
                                                <label>Latitude</label>
                                                <input type="number" step="any" name="latitude" value={vendorForm.latitude} onChange={handleVendorChange} />
                                            </div>
                                            <div>
                                                <label>Longitude</label>
                                                <input type="number" step="any" name="longitude" value={vendorForm.longitude} onChange={handleVendorChange} />
                                            </div>
                                        </div>

                                        <button type="button" className="btn-main full" onClick={handleUseCurrentLocation}>
                                            Update Location
                                        </button>
                                    </section>

                                    <form className="vps-card" onSubmit={handleSecuritySave}>
                                        <div className="vps-card-top">
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

                                        <div className="vps-form-grid">
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

                                        <button type="submit" className="btn-main" disabled={savingSecurity}>
                                            {savingSecurity ? "Updating..." : "Update Login Details"}
                                        </button>
                                    </form>

                                    <section className="vps-card danger">
                                        <div className="vps-card-top">
                                            <h4>Danger Zone</h4>
                                        </div>
                                        <p>Permanently delete your vendor account and vendor profile.</p>
                                        <button type="button" className="btn-danger-outline" onClick={handleDeleteAccount}>
                                            Permanently Delete Account
                                        </button>
                                    </section>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default VendorProfileSettings;