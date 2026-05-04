import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Header from "../components/header.js";
import LoadingModal from "../components/LoadingModal";

const API = "http://localhost:5000";
const AD_CONTACT = "074 3013 073"; // contact number for advertising

// PromoCard — shows a live vendor ad OR an "ad space available" fallback
const PromoCard = ({ ad, side, onShopNow }) => {
  const fallbackGradient = {
    left: "linear-gradient(135deg, rgba(15,118,110,0.92), rgba(6,78,59,0.95))",
    right: "linear-gradient(135deg, rgba(30,58,138,0.92), rgba(15,23,42,0.95))"
  }[side];

  if (!ad) {
    return (
      <div
        className={`promo-card promo-${side} d-flex align-items-center justify-content-center`}
        style={{
          backgroundImage: fallbackGradient,
          minHeight: "180px",
          border: "2px dashed rgba(255,255,255,0.25)"
        }}
      >
        <div className="text-center px-3">
          <span
            className="material-symbols-outlined d-block mb-2"
            style={{ fontSize: "36px", color: "rgba(255,255,255,0.55)" }}
          >
            campaign
          </span>
          <p
            className="fw-semibold mb-1"
            style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.95rem" }}
          >
            Advertisement Space Available
          </p>
          <p className="small mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            Reach thousands of auto part buyers
          </p>
          <a href={`tel:${AD_CONTACT}`} className="btn btn-sm btn-outline-light">
            Contact {AD_CONTACT}
          </a>
        </div>
      </div>
    );
  }

  const bgImage = ad.image_url
    ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${API}${ad.image_url})`
    : fallbackGradient;

  return (
    <div
      className={`promo-card promo-${side} d-flex align-items-end`}
      style={{
        backgroundImage: bgImage,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div>
        <h5>{ad.title}</h5>
        <p>{ad.description}</p>
        <button
          className="btn btn-outline-light btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onShopNow?.(ad);
          }}
        >
          {ad.cta_label || "Shop Now"}
        </button>
      </div>
    </div>
  );
};
const PromoSlider = ({ ads, side, onShopNow }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const sideAds = useMemo(() => {
    return ads?.[side] ?? [];
  }, [ads, side]);

  const ad = sideAds[currentIndex];

  useEffect(() => {
    if (!sideAds.length) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sideAds.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [sideAds]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [sideAds]);

  return <PromoCard ad={ad} side={side} onShopNow={onShopNow} />;
};

// ---------------------------------------------------------------------------
// PartCard — single listing tile (unchanged)
// ---------------------------------------------------------------------------
const PartCard = ({ item, onVendorClick, onViewDetails }) => {
  const [imgError, setImgError] = useState(false);

  const imgSrc = item.image_url && !imgError
    ? `${API}/${item.image_url.replace(/^\//, "")}`
    : null;

  const conditionLabel =
    item.condition === "new" ? "Genuine / New" : "Used";

  const businessName = item.vendor?.business_name || "Unknown Vendor";

  const vendorProfileId =
    item.vendor?._id || item.vendor?.vendor_id || item.vendor?.userId;

  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className="card part-card h-100"
        style={{ cursor: "pointer" }}
        onClick={() => onViewDetails(item._id)}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={item.title}
            onError={() => setImgError(true)}
            style={{
              height: "130px",
              objectFit: "cover",
              borderRadius: "12px 12px 0 0"
            }}
          />
        ) : (
          <div
            className="d-flex align-items-center justify-content-center bg-light"
            style={{ height: "130px", borderRadius: "12px 12px 0 0" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "48px", color: "#ccc" }}
            >
              image_search
            </span>
          </div>
        )}

        <div className="card-body">
          <h6 className="card-title mb-1" style={{ fontSize: "0.9rem" }}>
            {item.title || item.product?.name}
          </h6>

          <p className="card-text small mb-1 text-muted">
            {conditionLabel} •{" "}
            <span
              className="text-primary"
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={(e) => {
                e.stopPropagation();
                onVendorClick(vendorProfileId);
              }}
            >
              {businessName}
            </span>
          </p>

          <p className="card-text small mb-2">
            {item.review_count > 0
              ? `⭐ ${item.average_rating?.toFixed(1)} · ${item.review_count} reviews`
              : "No reviews yet"}
          </p>

          <div className="d-flex justify-content-between align-items-center">
            <span className="price-tag">LKR {item.price?.toLocaleString()}</span>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(item._id);
              }}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// VendorCard — verified vendor tile (unchanged)
// ---------------------------------------------------------------------------
const VendorCard = ({ vendor, onClick }) => {
  const [logoError, setLogoError] = useState(false);
  const vendorId = vendor._id || vendor.vendor_id?._id || vendor.vendor_id;

  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className="card vendor-card h-100 text-center"
        style={{ cursor: "pointer" }}
        onClick={() => onClick(vendorId)}
      >
        <div className="pt-3 pb-0 d-flex justify-content-center">
          {vendor.logo_url && !logoError ? (
            <img
              src={`${API}${vendor.logo_url}`}
              alt={vendor.business_name}
              onError={() => setLogoError(true)}
              style={{
                width: "56px",
                height: "56px",
                objectFit: "cover",
                borderRadius: "12px"
              }}
            />
          ) : (
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "40px",
                color: "#0f766e",
                background: "#e6f4f1",
                borderRadius: "12px",
                padding: "6px",
                width: "56px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              storefront
            </span>
          )}
        </div>

        <div className="card-body pt-2">
          <h6 className="card-title mb-1">{vendor.business_name}</h6>
          <p className="small mb-1 text-muted">{vendor.address || "Sri Lanka"}</p>
          <p className="small mb-2 text-success d-flex align-items-center justify-content-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>
              verified
            </span>
            Verified
          </p>
          <button
            className="btn btn-sm btn-outline-primary w-100"
            onClick={(e) => {
              e.stopPropagation();
              onClick(vendorId);
            }}
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Home Page
// ---------------------------------------------------------------------------
const Home = () => {
  const navigate = useNavigate();

  const [trendingListings, setTrendingListings] = useState([]);
  const [verifiedVendors, setVerifiedVendors] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);

  // Active ads — { left: adOrNull, right: adOrNull }
  const [activeAds, setActiveAds] = useState({ left: null, right: null });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchResultsRef = useRef(null);

const handleAdShopNow = (ad) => {
  const vendorId = ad?.vendor_profile_id;

  if (vendorId) {
    navigate(`/vendors/${vendorId}`);
  } else {
    console.warn("No vendor profile id found for ad:", ad);
  }
};

  // ── Fetch trending listings ───────────────────────────────────────────────
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API}/api/public/listings/trending`);
        if (!res.ok) { console.error("Trending fetch failed", res.status); return; }
        const data = await res.json();
        setTrendingListings(data);
      } catch (err) {
        console.error("Trending fetch error:", err);
      } finally {
        setLoadingTrending(false);
      }
    };
    fetchTrending();
  }, []);

  // ── Fetch verified vendors ────────────────────────────────────────────────
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch(`${API}/api/public/listings/vendors/verified`);
        if (!res.ok) { console.error("Vendors fetch failed", res.status); return; }
        const data = await res.json();
        setVerifiedVendors(data);
      } catch (err) {
        console.error("Vendors fetch error:", err);
      } finally {
        setLoadingVendors(false);
      }
    };
    fetchVendors();
  }, []);

  // ── Fetch active ads for promo slots ─────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/ads/active`)
      .then((r) => r.json())
      .then((slots) => setActiveAds(slots))
      .catch((err) => console.error("Ads fetch error:", err));
  }, []);

  // ── Search handler ────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setSearchLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `${API}/api/public/listings/latest?search=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data);
      setTimeout(() => {
        searchResultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setHasSearched(false);
    setSearchResults([]);
  };

  // ── Navigation helpers ────────────────────────────────────────────────────
  const goToListing = (id) => navigate(`/listings/${id}`);
  const goToVendor = (userId) => {
    if (userId) navigate(`/vendors/${userId}`);
  };

  // ── Filter chip search ────────────────────────────────────────────────────
  const handleChipSearch = (term) => {
    setSearchQuery(term);
    setSearchLoading(true);
    setHasSearched(true);
    fetch(`${API}/api/public/listings/latest?search=${encodeURIComponent(term)}`)
      .then((r) => r.json())
      .then((data) => {
        setSearchResults(data);
        setTimeout(() => {
          searchResultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      })
      .catch(console.error)
      .finally(() => setSearchLoading(false));
  };

  // ── image upload search ────────────────────────────────────────────────────
  const [identifying, setIdentifying] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset to loading state
    setIdentifying(true);
    setUploadStatus('loading');
    setStatusMessage('');

    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      try {
        const res = await fetch("http://localhost:5001/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 })
        });
        const data = await res.json();

        if (data.success) {
          // Success: trigger search and show success message
          setUploadStatus('success');
          setStatusMessage(`✅ Found: ${data.part_name}`);
          setTimeout(() => {
            setSearchQuery(data.part_name);
            handleChipSearch(data.part_name);
          }, 1500); // Show success for 1.5s then search

        } else if (data.reason === "blur") {
          setUploadStatus('error');
          setStatusMessage(`📷 ${data.message}`);

        } else if (data.reason === "unknown") {
          setUploadStatus('error');
          setStatusMessage("❓ Undefined part — please upload an image of a spare part.");

        } else {
          setUploadStatus('error');
          setStatusMessage("Something went wrong. Please try again.");
        }
      } catch (err) {
        console.error("Identify error:", err);
        setUploadStatus('error');
        setStatusMessage("Could not connect to the image recognition service.");
      } finally {
        // Keep modal open for status message, auto-close after 3s
        setTimeout(() => {
          setIdentifying(false);
          setUploadStatus(null);
          setStatusMessage('');
        }, 3000);
      }
    };

    reader.onerror = () => {
      console.error("FileReader error");
      setUploadStatus('error');
      setStatusMessage("Failed to read image file.");
      setTimeout(() => {
        setIdentifying(false);
        setUploadStatus(null);
        setStatusMessage('');
      }, 3000);
    };

    reader.readAsDataURL(file);
  };


  return (
    <div className="home-page">
      <Header />

      {/* ── Hero / Search section ─────────────────────────────────────── */}
      <section className="hero-section">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-10">
              <h1 className="hero-title">Find the Perfect Auto Parts</h1>
              <p className="hero-subtitle">
                Search from verified Sri Lankan vendors by part name, vehicle or image.
              </p>

              <div className="hero-search-wrapper">
                <form onSubmit={handleSearch}>
                  <div className="hero-search-bar">
                    <label className="hero-upload-btn" title="Upload image">
                      {identifying ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        <>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 18 }}
                          >
                            image_search
                          </span>
                          <span className="upload-text">Upload Image</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageUpload}
                      />
                    </label>

                    <input
                      type="text"
                      className="hero-search-input"
                      placeholder="Search by part name or vehicle model"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {hasSearched && (
                      <button
                        type="button"
                        className="hero-clear-btn"
                        onClick={handleClearSearch}
                        title="Clear search"
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "20px" }}
                        >
                          close
                        </span>
                      </button>
                    )}

                    <button
                      className="hero-search-btn"
                      type="submit"
                      disabled={searchLoading}
                    >
                      {searchLoading ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        "Search"
                      )}
                    </button>
                  </div>
                </form>

                <div className="hero-filters mt-3 d-flex flex-wrap justify-content-center">
                  {["Engine", "Suspension", "Electrical", "Body Parts"].map((chip) => (
                    <button
                      key={chip}
                      className="btn btn-sm btn-outline-light me-2 mb-2"
                      onClick={() => handleChipSearch(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Promo Cards — live ads or fallback ─────────────────────── */}
<div className="row mt-4 g-3">
  <div className="col-md-6">
    <PromoSlider ads={activeAds} side="left" onShopNow={handleAdShopNow} />
  </div>
  <div className="col-md-6">
    <PromoSlider ads={activeAds} side="right" onShopNow={handleAdShopNow} />
  </div>
</div>
        </div>
      </section>

      {/* ── Search Results ────────────────────────────────────────────── */}
      {hasSearched && (
        <section className="section-padding" ref={searchResultsRef}>
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
              <h2 className="section-title mb-2">
                {searchLoading
                  ? "Searching..."
                  : `Results for "${searchQuery}" (${searchResults.length})`}
              </h2>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleClearSearch}
              >
                Clear results
              </button>
            </div>

            {searchLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-muted py-5">
                <span
                  className="material-symbols-outlined d-block mb-2"
                  style={{ fontSize: "48px" }}
                >
                  search_off
                </span>
                No parts found for &quot;{searchQuery}&quot;. Try a different keyword.
              </div>
            ) : (
              <div className="row g-3">
                {searchResults.map((item) => (
                  <PartCard
                    key={item._id}
                    item={item}
                    onVendorClick={goToVendor}
                    onViewDetails={goToListing}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Trending & Newly Listed ───────────────────────────────────── */}
      <section className="section-padding">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
            <h2 className="section-title mb-2">Trending &amp; Newly Listed Parts</h2>
            <button className="btn p-0" onClick={() => navigate("/parts")}>
              View All
            </button>
          </div>

          {loadingTrending ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" />
            </div>
          ) : trendingListings.length === 0 ? (
            <div className="text-muted small">
              No parts listed yet. Vendors will appear here soon.
            </div>
          ) : (
            <div className="row g-3">
              {trendingListings.map((item) => (
                <PartCard
                  key={item._id}
                  item={item}
                  onVendorClick={goToVendor}
                  onViewDetails={goToListing}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Verified Vendors ─────────────────────────────────────────── */}
      <section className="section-padding bg-light">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
            <h2 className="section-title mb-2">Verified Vendors</h2>
            <button className="btn p-0" onClick={() => navigate("/vendors")}>
              View All Vendors
            </button>
          </div>

          {loadingVendors ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" />
            </div>
          ) : verifiedVendors.length === 0 ? (
            <div className="text-muted small">No verified vendors yet.</div>
          ) : (
            <div className="row g-3">
              {verifiedVendors.map((vendor) => (
                <VendorCard
                  key={vendor._id}
                  vendor={vendor}
                  onClick={goToVendor}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Community Highlights ─────────────────────────────────────── */}
      <section className="section-padding">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
            <h2 className="section-title mb-2">Community Highlights</h2>
            <button className="btn p-0">Visit Forum</button>
          </div>
          <div className="row g-3">
            {[1, 2, 3].map((post) => (
              <div className="col-12 col-lg-4" key={post}>
                <div className="card forum-card h-100">
                  <div className="card-body">
                    <h6 className="card-title mb-1">
                      Tips for maintaining hybrid vehicles
                    </h6>
                    <p className="small mb-1 text-muted">
                      Posted by K.D. Brendon • 2h ago
                    </p>
                    <p className="small mb-2">
                      Discussion on common issues and recommended spare parts for
                      city driving conditions.
                    </p>
                    <button className="btn btn-sm btn-outline-primary">
                      View Discussion
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose ───────────────────────────────────────────────── */}
      <section className="section-padding why-section">
        <div className="container text-center">
          <h2 className="section-title mb-3">Why Choose Spare Ceylon?</h2>
          <p className="section-subtitle mb-4">
            Sri Lanka's trusted marketplace for genuine and verified auto parts.
          </p>
          <div className="row g-3 justify-content-center">
            <div className="col-12 col-md-4">
              <div className="why-card">
                <h6>Best Price</h6>
                <p className="small">
                  Compare offers from multiple verified vendors in one place.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="why-card">
                <h6>Trusted Community</h6>
                <p className="small">
                  Ratings, reviews and forum discussions from real customers.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="why-card">
                <h6>Verified Quality</h6>
                <p className="small">
                  Vendor verification and smart matching for your vehicle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="footer-section">
        <div className="container text-center">
          <p className="small" style={{ color: "white" }}>
            <span style={{ cursor: "pointer" }} onClick={() => navigate("/admin/login")}>
              Admin
            </span>
          </p>
          <p className="mb-0 small text-light">
            © {new Date().getFullYear()} Spare Ceylon. All rights reserved.
          </p>
        </div>
      </footer>
      <LoadingModal
        isOpen={identifying}
        status={uploadStatus}
        message={statusMessage}
      />
    </div>
  );
};

export default Home;