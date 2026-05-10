import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/Footer";
import "./styles/Vendors.css";

const API = "http://localhost:5000";

//Sub-component for individual Vendor cards
const VendorCard = ({ vendor, onViewVendor }) => {
  const [imgError, setImgError] = useState(false);

  const imgSrc =
    vendor.logo_url && !imgError
      ? `${API}/${vendor.logo_url.replace(/^\//, "")}`
      : null;

  const isVerified = vendor.verification_status === "verified";

  return (
    <div className="col-12 col-sm-6 col-lg-6 col-xl-4 col-xxl-3">
      <div className="card vendors-card h-100 shadow-sm border-0">
        <div
          className="vendors-card-top"
          style={{ height: "180px", overflow: "hidden", backgroundColor: "#f8f9fa" }}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={vendor.business_name}
              className="vendors-card-img-top w-100 h-100"
              style={{ objectFit: "cover" }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="vendors-card-img-placeholder d-flex align-items-center justify-content-center h-100">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "48px", color: "#ccc" }}
              >
                storefront
              </span>
            </div>
          )}
        </div>

        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
            <h6 className="card-title mb-0 text-dark fw-bold text-truncate">
              {vendor.business_name}
            </h6>
            <span className={`badge rounded-pill ${isVerified ? "bg-success" : "bg-secondary"}`}>
              {isVerified ? "Verified" : "Not Verified"}
            </span>
          </div>

          <p className="small text-muted mb-1">
            <strong>Reg No:</strong> {vendor.business_reg_no}
          </p>
          <p className="small text-muted mb-2 text-truncate">{vendor.address}</p>
          <p className="small text-muted mb-3" style={{ flexGrow: 1, display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {vendor.description || "No description available."}
          </p>

          <div className="mt-auto">
            <button
              className="btn btn-sm btn-outline-success w-100 fw-bold"
              type="button"
              onClick={() => onViewVendor(vendor._id)}
            >
              View Vendor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


 // Main Vendors List Component

const Vendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    verification: []
  });

  //handles the formatting of search and filter queries for the URL
  const buildParams = useCallback((override = {}) => {
    const params = {};
    const q = override.q !== undefined ? override.q : searchQuery;

    if (q.trim()) params.q = q.trim();
    if (filters.verification.length) params.verification = filters.verification.join(",");

    return params;
  }, [searchQuery, filters]);

  const loadVendors = async (override = {}) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/public/vendors/all`, {
        params: buildParams(override)
      });
      setVendors(res.data.items || res.data || []);
    } catch (err) {
      console.error("Error loading vendors:", err);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    loadVendors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(!!searchQuery.trim());
    loadVendors();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setHasSearched(false);
    loadVendors({ q: "" });
  };

  const toggleVerification = (value) => {
    setFilters((prev) => {
      const exists = prev.verification.includes(value);
      const next = exists
        ? prev.verification.filter((v) => v !== value)
        : [...prev.verification, value];
      return { ...prev, verification: next };
    });
  };

  const handleViewVendor = (id) => {
    navigate(`/vendors/${id}`);
  };

  return (
    <div className="vendors-page bg-light min-vh-100">
      <Header />

      <main className="container-fluid px-4 py-4">
        {/* Search Bar Section */}
        <section className="vendors-search-box mb-4">
          <p className="vendors-search-label mb-2">Find Vendors</p>

          <form onSubmit={handleSearch}>
            <div className="vendors-search-row">
              <input
                type="text"
                className="vendors-search-input"
                placeholder="Search by vendor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {hasSearched && (
                <button
                  type="button"
                  className="vendors-clear-simple"
                  onClick={handleClearSearch}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}

              <button className="vendors-search-btn" type="submit">
                Search
              </button>
            </div>
          </form>
        </section>

        <div className="row g-4">
          {/* Sidebar Filters */}
          <aside className="col-lg-3 col-xl-2">
            <div className="card shadow-sm border-0" style={{ top: "20px" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold">Filters</h6>
                  <button
                    className="btn btn-link btn-sm text-decoration-none p-0 text-success"
                    onClick={() => loadVendors()}
                  >
                    Apply
                  </button>
                </div>
                <hr />
                <div className="mb-3">
                  <label className="small fw-semibold mb-2 d-block">Verification Status</label>
                  {["verified", "not"].map((status) => (
                    <div className="form-check" key={status}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`v-${status}`}
                        checked={filters.verification.includes(status)}
                        onChange={() => toggleVerification(status)}
                      />
                      <label className="form-check-label small cursor-pointer" htmlFor={`v-${status}`}>
                        {status === "verified" ? "Verified" : "Not Verified"}
                      </label>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-success btn-sm w-100 mt-2"
                  onClick={() => loadVendors()}
                >
                  Update Results
                </button>
              </div>
            </div>
          </aside>

          {/* Vendors Listing Grid */}
          <section className="col-lg-9 col-xl-10">
            <div className="mb-3">
              <span className="small text-muted fw-medium">
                Found {vendors.length} vendors
                {hasSearched && ` for "${searchQuery}"`}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-5 bg-white rounded shadow-sm border">
                <p className="text-muted mb-0">No vendors found matching your criteria.</p>
              </div>
            ) : (
              <div className="row g-3">
                {vendors.map((vendor) => (
                  <VendorCard
                    key={vendor._id}
                    vendor={vendor}
                    onViewVendor={handleViewVendor}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Vendors;