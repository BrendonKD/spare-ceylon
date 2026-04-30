import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/header";
import "./VendorDetails.css";

const API = "http://localhost:5000";

const ProductCard = ({ item, onViewDetails }) => {
  const [imgError, setImgError] = useState(false);

  const imgSrc =
    item.image_url && !imgError
      ? `${API}/${item.image_url.replace(/^\//, "")}`
      : null;

  const conditionLabel =
    item.condition === "new" ? "Genuine / New" : "Used / Reconditioned";

  const product = item.product_id || {};

  return (
    <div className="vendor-product-col">
      <div className="card vendor-product-card h-100 border-0 shadow-sm">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={item.title || product.name}
            className="vendor-product-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="vendor-product-placeholder">
            <span className="material-symbols-outlined">image</span>
          </div>
        )}

        <div className="card-body d-flex flex-column">
          <h6 className="vendor-product-title mb-1">{item.title || product.name}</h6>
          {product.name && <p className="small text-muted mb-1">{product.name}</p>}
          <p className="small text-muted mb-1">{conditionLabel}</p>
          <p className="small text-muted mb-3">{item.location || "Sri Lanka"}</p>

          <div className="mt-auto d-flex justify-content-between align-items-center gap-2">
            <span className="vendor-product-price">
              Rs {item.price?.toLocaleString?.() || item.price}
            </span>
            <button
              className="btn btn-sm vendor-outline-btn"
              onClick={() => onViewDetails(item._id)}
            >
              View Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  const logoSrc =
    vendor?.logo_url && !logoError
      ? `${API}/${vendor.logo_url.replace(/^\//, "")}`
      : null;

  const verificationDocSrc =
    vendor?.verification_document_url &&
      vendor?.verification_document_visible &&
      vendor?.verification_document_status === "active" &&
      vendor?.verification_status === "verified"
      ? `${API}/${vendor.verification_document_url.replace(/^\//, "")}`
      : null;

  const loadVendorDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/public/vendors/${id}`);
      setVendor(res.data.vendor || null);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error loading vendor details:", err);
      setVendor(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorDetails();
  }, [id]);

  const handleViewProduct = (listingId) => {
    navigate(`/listings/${listingId}`);
  };

  const handleOpenVerificationDoc = () => {
    if (!verificationDocSrc) return;
    setShowDocModal(true);
  };

  const handleCloseVerificationDoc = () => {
    setShowDocModal(false);
  };

  return (
    <div className="vendor-details-page">
      <Header />

      <main className="vendor-details-main py-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border vendor-primary-text" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : !vendor ? (
          <div className="vendor-empty-state text-center bg-white shadow-sm">
            <h4 className="mb-2">Vendor not found</h4>
            <p className="text-muted mb-0">
              The vendor you are trying to view does not exist.
            </p>
          </div>
        ) : (
          <>
            <section className="vendor-hero-card shadow-sm">
              <div className="vendor-hero-content">
                <div>
                  <p className="vendor-eyebrow mb-2">Vendor profile</p>
                  <h1 className="vendor-business-name mb-2">{vendor.business_name}</h1>

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span
                      className={`badge rounded-pill ${vendor.verification_status === "verified"
                        ? "bg-success"
                        : "bg-secondary"
                        }`}
                    >
                      {vendor.verification_status === "verified"
                        ? "Verified Seller"
                        : "Seller"}
                    </span>

                    <span className="badge vendor-badge-soft">
                      Reg No: {vendor.business_reg_no}
                    </span>
                  </div>

                  <p className="vendor-meta mb-2">{vendor.address}</p>
                  <p className="vendor-description mb-0">
                    {vendor.description || "This vendor has not added a description yet."}
                  </p>
                </div>

                <div className="vendor-hero-actions">
                  <div className="vendor-logo-wrap">
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt={vendor.business_name}
                        className="vendor-hero-logo"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="vendor-hero-logo vendor-hero-logo-placeholder">
                        <span className="material-symbols-outlined">storefront</span>
                      </div>
                    )}
                  </div>

                  <div className="vendor-action-row">
                    {vendor.verification_status === "verified" && verificationDocSrc && (
                      <button
                        className="vendor-verified-doc-btn"
                        onClick={handleOpenVerificationDoc}
                        type="button"
                      >
                        <span className="material-symbols-outlined">workspace_premium</span>
                      </button>
                    )}

                    <button
                      className="vendor-primary-btn"
                      onClick={() => navigate(`/messages/${vendor._id}`)}
                      type="button"
                    >
                      Contact Seller
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="vendor-section-title mb-1">Listed products</h4>
                  <p className="text-muted mb-0">
                    {products.length} items available from this seller
                  </p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="vendor-empty-state text-center bg-white shadow-sm">
                  <p className="text-muted mb-0">
                    No products available for this vendor yet.
                  </p>
                </div>
              ) : (
                <div className="vendor-products-grid">
                  {products.map((item) => (
                    <ProductCard
                      key={item._id}
                      item={item}
                      onViewDetails={handleViewProduct}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showDocModal && (
        <div className="vendor-doc-modal-overlay" onClick={handleCloseVerificationDoc}>
          <div
            className="vendor-doc-modal simple-doc-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vendor-doc-modal-header">
              <div className="vendor-doc-modal-title">
                <span className="material-symbols-outlined">workspace_premium</span>
                <h5 className="mb-0">Verification Document</h5>
              </div>

              <button
                type="button"
                className="vendor-doc-close-btn"
                onClick={handleCloseVerificationDoc}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="vendor-doc-modal-body">
              {verificationDocSrc ? (
                <iframe
                  src={`${verificationDocSrc}#toolbar=0&navpanes=0&scrollbar=0`}
                  title="Vendor verification document"
                  className="vendor-doc-frame"
                />
              ) : (
                <div className="vendor-doc-empty">
                  <span className="material-symbols-outlined">description</span>
                  <p className="mb-0">Verification document is not available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetails;