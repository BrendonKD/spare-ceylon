import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./AdminVendorDetails.css";

import AdminSidebar from "../admin/components/AdminSidebar";
import AdminHeader from "../admin/components/AdminHeader";

const API = "http://localhost:5000/api/admin/vendors";
const FILE_BASE = "http://localhost:5000";

const VendorDetails = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [vendor, setVendor] = useState(null);
  const [message, setMessage] = useState("");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchVendor = async () => {
    try {
      setMessage("");
      const res = await axios.get(`${API}/${vendorId}`, authConfig);
      setVendor(res.data.vendor);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to load vendor details.");
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const fileUrl = (path) => {
    if (!path) return "#";
    if (path.startsWith("http")) return path;
    return `${FILE_BASE}${path}`;
  };

  const handleVerify = async (status) => {
    try {
      let regenerateCertificate = false;

      // Ask to regenerate ONLY if verified and doc already exists
      if (status === "verified" && vendor?.verification_document_url) {
        regenerateCertificate = window.confirm(
          "A certificate already exists. Do you want to regenerate it with the latest details?"
        );
      }

      await axios.put(
        `${API}/${vendorId}/verify`,
        {
          verification_status: status,
          regenerate_certificate: regenerateCertificate,
        },
        authConfig
      );

      setMessage(`Vendor ${status} successfully.`);
      fetchVendor();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed.");
    }
  };

  //vendor verified certificate protected
  const handleOpenVerificationDocument = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/vendor-documents/${vendor._id}/verification-document`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const file = new Blob([res.data], { type: "application/pdf" });
      const fileURL = window.URL.createObjectURL(file);
      window.open(fileURL, "_blank");
    } catch (error) {
      setMessage(
        error?.response?.data?.message || "Failed to open verification document."
      );
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("Delete this vendor permanently?");
    if (!ok) return;

    try {
      await axios.delete(`${API}/${vendorId}`, authConfig);
      navigate("/admin/vendors");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to delete vendor.");
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader />

      <div className="admin-body">
        <AdminSidebar activeItem="vendors" />

        <main className="admin-main">
          <div className="admin-page-shell">
            {!vendor ? (
              <div className="admin-card">Loading vendor details...</div>
            ) : (
              <>
                <div className="admin-page-head detail-head">
                  <div>
                    <p>Admin Panel</p>
                    <h2>Vendor Details</h2>
                    <span>Review submitted business information and verify the vendor.</span>
                  </div>

                  <span className={`status-badge ${vendor.verification_status}`}>
                    {vendor.verification_status}
                  </span>
                </div>

                {message && <div className="admin-alert">{message}</div>}

                <div className="vendor-details-grid">
                  <section className="admin-card">
                    <div className="card-head">
                      <h4>Business Information</h4>
                    </div>

                    <div className="logo-row">
                      <div className="logo-box">
                        {vendor.logo_url ? (
                          <img src={fileUrl(vendor.logo_url)} alt="Business logo" />
                        ) : (
                          <div className="placeholder">No Logo</div>
                        )}
                      </div>

                      <div className="logo-meta">
                        <div><strong>Business Name:</strong> {vendor.business_name}</div>
                        <div><strong>Registration No:</strong> {vendor.business_reg_no}</div>
                        <div><strong>Address:</strong> {vendor.address}</div>
                      </div>
                    </div>

                    <div className="info-block">
                      <strong>Description</strong>
                      <p>{vendor.description || "No description provided."}</p>
                    </div>
                  </section>

                  <section className="admin-card">
                    <div className="card-head">
                      <h4>Owner Details</h4>
                    </div>

                    <div className="info-list">
                      <div><strong>Full Name:</strong> {vendor.vendor_id?.full_name || "-"}</div>
                      <div><strong>Email:</strong> {vendor.vendor_id?.email || "-"}</div>
                      <div><strong>Phone:</strong> {vendor.vendor_id?.phone || "-"}</div>
                      <div><strong>Role:</strong> {vendor.vendor_id?.role || "-"}</div>
                      <div><strong>User Status:</strong> {vendor.vendor_id?.status || "-"}</div>
                    </div>
                  </section>

                  <section className="admin-card">
                    <div className="card-head">
                      <h4>Business Location</h4>
                    </div>

                    {vendor.latitude && vendor.longitude ? (
                      <>
                        <div className="map-box">
                          <iframe
                            title="Vendor location"
                            src={`https://www.google.com/maps?q=${vendor.latitude},${vendor.longitude}&z=15&output=embed`}
                          />
                        </div>

                        <div className="info-list two">
                          <div><strong>Latitude:</strong> {vendor.latitude}</div>
                          <div><strong>Longitude:</strong> {vendor.longitude}</div>
                        </div>
                      </>
                    ) : (
                      <p className="empty-text">No location submitted.</p>
                    )}
                  </section>

                  <section className="admin-card">
                    <div className="card-head">
                      <h4>Verification Documents</h4>
                    </div>

                    <div className="docs-grid">
                      <a href={fileUrl(vendor.nic_front_url)} target="_blank" rel="noreferrer" className="doc-box">
                        NIC Front
                      </a>
                      <a href={fileUrl(vendor.nic_back_url)} target="_blank" rel="noreferrer" className="doc-box">
                        NIC Back
                      </a>
                      <a href={fileUrl(vendor.br_certificate_url)} target="_blank" rel="noreferrer" className="doc-box">
                        Business Registration
                      </a>
                      <a href={fileUrl(vendor.registration_certificate_url)} target="_blank" rel="noreferrer" className="doc-box">
                        Registration Certificate
                      </a>
                    </div>
                  </section>
                </div>

                <div className="detail-actions">
                  <button className="btn-light" onClick={() => navigate("/admin/vendors")}>
                    Back to List
                  </button>

                  <div className="right-actions">
                    {vendor.verification_document_url &&
                      vendor.verification_document_visible &&
                      vendor.verification_document_status === "active" &&
                      vendor.verification_status === "verified" && (
                        <button
                          type="button"
                          className="btn-light"
                          onClick={handleOpenVerificationDocument}
                        >
                          View Verification Document
                        </button>
                      )}

                    <button className="btn-reject" onClick={() => handleVerify("rejected")}>
                      Reject
                    </button>
                    <button className="btn-approve" onClick={() => handleVerify("verified")}>
                      Approve & Verify
                    </button>
                    <button className="btn-outline-danger" onClick={handleDelete}>
                      Delete Vendor
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorDetails;