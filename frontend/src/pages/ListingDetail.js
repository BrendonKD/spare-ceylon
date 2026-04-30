import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ListingDetail.css";
import Header from "../components/header.js";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const API = "http://localhost:5000";

// Stars
const Stars = ({ rating = 0 }) => {
  const rounded = Math.round(rating);
  return (
    <span className="ld-stars">
      {"★".repeat(rounded)}
      {"☆".repeat(5 - rounded)}
    </span>
  );
};

// PartCard
const PartCard = ({ item, onVendorClick, onViewDetails }) => {
  const [imgError, setImgError] = useState(false);
  const imgSrc =
    item.image_url && !imgError
      ? `${API}/${item.image_url.replace(/^\//, "")}`
      : null;

  const conditionLabel = item.condition === "new" ? "Genuine / New" : "Used";
  const businessName = item.vendor?.business_name || "Unknown Vendor";

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
            style={{ height: "130px", objectFit: "cover", borderRadius: "12px 12px 0 0" }}
          />
        ) : (
          <div
            className="d-flex align-items-center justify-content-center bg-light"
            style={{ height: "130px", borderRadius: "12px 12px 0 0" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#ccc" }}>
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
                onVendorClick(item.vendor?.userId);
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

const ReviewCard = ({ review }) => {
  const customerName = review.customer_id?.full_name || "Anonymous";
  const comment = review.comment?.trim();
  const reviewDate = new Date(review.createdAt).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="col-6 col-md-4 col-lg-2">
      <div className="card ld-review-card h-100">
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="mb-0 ld-review-name">{customerName}</h6>
            <span className="ld-review-rating">⭐ {review.rating}/5</span>
          </div>

          <p className="text-muted small mb-2">{reviewDate}</p>

          <p className="ld-review-comment small mb-0">
            {comment || "Customer left a rating without a written comment."}
          </p>
        </div>
      </div>
    </div>
  );
};

const ListingDetail = () => {
  const { addToCart } = useCart();
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [moreFromVendor, setMoreFromVendor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setImgError(false);
    setQuantity(1);
    setError("");

    fetch(`${API}/api/public/listings/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(({ listing, moreFromVendor }) => {
        setListing(listing);
        setMoreFromVendor(moreFromVendor);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    setReviewsLoading(true);
    setReviewsError("");

    fetch(`${API}/api/reviews/listing/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load reviews");
        return r.json();
      })
      .then((data) => setReviews(data || []))
      .catch((err) => {
        setReviewsError(err.message);
        setReviews([]);
      })
      .finally(() => setReviewsLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="ld-page">
        <Header />
        <div className="ld-center-state">
          <div className="spinner-border text-success" />
          <p className="mt-3 text-muted">Loading listing…</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="ld-page">
        <Header />
        <div className="ld-center-state">
          <span className="material-symbols-outlined ld-err-icon">error</span>
          <p className="text-muted mt-2">Listing not found or unavailable.</p>
          <button className="btn btn-outline-success btn-sm mt-2" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const {
    title,
    price,
    condition,
    image_url,
    description,
    quantity_available,
    location,
    vendor,
    product,
    average_rating,
    review_count
  } = listing;

  const avgRating = average_rating || 0;
  const reviewCount = review_count || 0;
  const conditionLabel = condition === "new" ? "Brand New" : "Used";
  const isVerified = vendor?.verification_status === "verified";

  const changeQty = (delta) =>
    setQuantity((q) => Math.max(1, Math.min(quantity_available, q + delta)));

  const goToVendor = (userId) => {
    if (userId) navigate(`/vendors/${userId}`);
  };

  const goToListing = (itemId) => navigate(`/listings/${itemId}`);

  return (
    <div className="ld-page">
      <Header />

      <div className="container py-4">
        <nav className="mb-3">
          <ol className="breadcrumb ld-breadcrumb">
            <li className="breadcrumb-item">
              <span onClick={() => navigate("/")} className="ld-link">Home</span>
            </li>
            <li className="breadcrumb-item">
              <span onClick={() => navigate(-1)} className="ld-link">Parts</span>
            </li>
            <li className="breadcrumb-item active text-truncate" style={{ maxWidth: 260 }}>
              {title}
            </li>
          </ol>
        </nav>

        <div className="row g-4 mb-5">
          <div className="col-lg-5">
            <div className="ld-img-wrap">
              {image_url && !imgError ? (
                <img
                  src={`${API}/${image_url.replace(/^\//, "")}`}
                  alt={title}
                  onError={() => setImgError(true)}
                  className="ld-main-img"
                />
              ) : (
                <div className="ld-img-placeholder">
                  <span className="material-symbols-outlined">image_search</span>
                  <p>No image available</p>
                </div>
              )}
              <span className={`ld-cond-badge badge ${condition === "new" ? "bg-success" : "bg-secondary"}`}>
                {conditionLabel}
              </span>
            </div>
          </div>

          <div className="col-lg-4">
            <h1 className="ld-title">{title}</h1>

            <div className="ld-price-row mb-2">
              <span className="ld-price">Rs. {price?.toLocaleString()}</span>
            </div>

            <div className="d-flex align-items-center gap-2 mb-3">
              <Stars rating={avgRating} />
              <span className="text-muted small">
                {reviewCount > 0
                  ? `${avgRating.toFixed(1)} (${reviewCount} reviews)`
                  : "No reviews yet"}
              </span>
              <span className="text-muted small">•</span>
              <span className="material-symbols-outlined ld-icon-sm">shopping_cart</span>
              <span className="text-muted small">{listing.items_sold || 0} sold</span>
            </div>

            <div className="ld-details-table mb-3">
              <h6 className="ld-section-head">Product Details</h6>
              <table className="table table-sm table-borderless mb-0">
                <tbody>
                  {product?.name && (
                    <tr><td className="ld-td-key">Product</td><td>{product.name}</td></tr>
                  )}
                  {product?.brand && (
                    <tr><td className="ld-td-key">Brand</td><td>{product.brand}</td></tr>
                  )}
                  <tr><td className="ld-td-key">Condition</td><td>{conditionLabel}</td></tr>
                  {product?.oem_part_number && (
                    <tr><td className="ld-td-key">OEM Number</td><td><code>{product.oem_part_number}</code></td></tr>
                  )}
                  {product?.compatibility && (
                    <tr><td className="ld-td-key">Compatibility</td><td>{product.compatibility}</td></tr>
                  )}
                  {location && (
                    <tr><td className="ld-td-key">Location</td><td>{location}</td></tr>
                  )}
                  <tr>
                    <td className="ld-td-key">Stock</td>
                    <td>
                      <span className={`badge ${quantity_available > 5 ? "bg-success" : "bg-warning text-dark"}`}>
                        {quantity_available} available
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {description && (
              <div className="mb-3">
                <h6 className="ld-section-head">Description</h6>
                <p className="ld-desc">{description}</p>
              </div>
            )}
          </div>

          <div className="col-lg-3">
            <div className="ld-vendor-card mb-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="material-symbols-outlined ld-icon-sm text-muted">storefront</span>
                <span className="text-muted small">Sold by</span>
              </div>
              {vendor?.logo_url && (
                <img src={`${API}${vendor.logo_url}`} alt={vendor.business_name} className="ld-vendor-logo mb-2" />
              )}
              <div
                className="ld-vendor-name"
                role="button"
                tabIndex={0}
                onClick={() => goToVendor(vendor?._id || vendor?.vendor_id || vendor?.userId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    goToVendor(vendor?._id || vendor?.vendor_id || vendor?.userId);
                  }
                }}
              >
                {vendor?.business_name || "Unknown Vendor"}
              </div>
              {isVerified && (
                <div className="d-flex align-items-center gap-1 mt-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#0f766e" }}>verified</span>
                  <span className="text-success small fw-semibold">Verified Seller</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="material-symbols-outlined ld-icon-sm text-muted">local_shipping</span>
                <span className="small fw-semibold">Shipping</span>
              </div>
              <div className="ld-shipping-row">
                <span className="text-muted small">Shipping Fee:</span>
                <span className="small fw-semibold text-success">Rs. 900.00</span>
              </div>
              <div className="ld-shipping-row">
                <span className="text-muted small">Delivery:</span>
                <span className="small fw-semibold">3–5 days</span>
              </div>
            </div>

            <div className="ld-purchase-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="small fw-semibold text-muted">Quantity</span>
                <span className="small text-muted">{quantity_available} available</span>
              </div>
              <div className="ld-qty-row mb-3">
                <button className="ld-qty-btn" onClick={() => changeQty(-1)} disabled={quantity <= 1}>−</button>
                <span className="ld-qty-val">{quantity}</span>
                <button className="ld-qty-btn" onClick={() => changeQty(1)} disabled={quantity >= quantity_available}>+</button>
              </div>
              <Link to={`/checkout/${listing._id}`} className="text-decoration-none">
                <button className="btn btn-success w-100 mb-2 ld-buy-btn d-flex align-items-center justify-content-center">
                  <span className="material-symbols-outlined ld-icon-sm me-1">bolt</span>
                  Buy Now
                </button>
              </Link>
              <button
                className="btn btn-outline-success w-100 ld-cart-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(listing);
                }}
              >
                <span className="material-symbols-outlined ld-icon-sm me-1">shopping_cart</span>
                Add to Cart
              </button>
              <div className="ld-trust-badges mt-3">
                {[
                  { icon: "shield", text: "Secure Payment" },
                  { icon: "replay", text: "7 Days Return Policy" },
                  { icon: "verified_user", text: "Quality Guaranteed" }
                ].map(({ icon, text }) => (
                  <div key={text} className="ld-trust-item">
                    <span className="material-symbols-outlined ld-icon-sm text-success">{icon}</span>
                    <span className="small text-muted">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ld-reviews-section mt-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="ld-section-head mb-0">Customer Reviews</h5>
            <span className="text-muted small">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          {reviewsLoading ? (
            <div className="ld-center-state py-4">
              <div className="spinner-border text-success" />
              <p className="mt-3 text-muted mb-0">Loading reviews…</p>
            </div>
          ) : reviewsError ? (
            <div className="alert alert-light border">
              <span className="text-muted">Unable to load reviews right now.</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="ld-empty-reviews text-center py-4">
              <span className="material-symbols-outlined mb-2" style={{ fontSize: "40px", color: "#bdbdbd" }}>
                rate_review
              </span>
              <p className="text-muted mb-0">No customer reviews yet for this item.</p>
            </div>
          ) : (
            <div className="row g-3">
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          )}
        </div>

        {moreFromVendor.length > 0 && (
          <div className="ld-more-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="ld-section-head mb-0">
                More from {vendor?.business_name}
              </h5>
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => goToVendor(vendor?._id || vendor?.vendor_id || vendor?.userId)}
              >
                View All
              </button>
            </div>

            <div className="row g-3">
              {moreFromVendor.map((item) => (
                <PartCard
                  key={item._id}
                  item={item}
                  onVendorClick={goToVendor}
                  onViewDetails={goToListing}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="ld-footer">
        <div className="container">
          <div className="row py-4 g-4">
            <div className="col-md-4">
              <h6 className="fw-bold mb-2">About Spare Ceylon</h6>
              <p className="small text-muted mb-0">Your trusted marketplace for quality vehicle spare parts in Sri Lanka.</p>
            </div>
            <div className="col-md-4">
              <h6 className="fw-bold mb-2">Customer Service</h6>
              <div className="ld-footer-links">
                <span>Help Center</span>
                <span>Returns &amp; Refunds</span>
                <span>Shipping Info</span>
              </div>
            </div>
            <div className="col-md-4">
              <h6 className="fw-bold mb-2">Contact</h6>
              <p className="small text-muted mb-0">Phone: +94 11 234 5678</p>
              <p className="small text-muted mb-0">Email: support@spareceylon.lk</p>
            </div>
          </div>
          <div className="border-top pt-3 text-center">
            <p className="small text-muted mb-0">© {new Date().getFullYear()} Spare Ceylon. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ListingDetail;