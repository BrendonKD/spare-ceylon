import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/header";
import CustomerSidebar from "../components/CustomerSidebar";
import "./OrderTracking.css";

const API = "http://localhost:5000";

const STEP_CONFIG = [
  { key: "placed", label: "Order Placed", icon: "shopping_bag" },
  { key: "confirmed", label: "Confirmed", icon: "task_alt" },
  { key: "packed", label: "Packed", icon: "inventory_2" },
  { key: "shipped", label: "Shipped", icon: "local_shipping" },
  { key: "delivered", label: "Delivered", icon: "home" }
];

const statusToStepIndex = (status) => {
  switch (status) {
    case "pending":
      return 0;
    case "confirmed":
      return 1;
    case "shipped":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState({ full_name: "Loading...", email: "..." });
  const [order, setOrder] = useState(null);
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [userRes, orderRes] = await Promise.all([
          axios.get(`${API}/api/auth/profile`, { headers }),
          axios.get(`${API}/api/orders/${orderId}`, { headers })
        ]);

        setUser({
          full_name: userRes.data.full_name,
          email: userRes.data.email
        });

        setOrder(orderRes.data);

        const reviewRes = await axios.get(`${API}/api/reviews/order/${orderId}`, {
          headers
        });

        setReview(reviewRes.data);
      } catch (err) {
        console.error("Error fetching order tracking data", err);
        navigate("/customer/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, navigate]);

  const submitReview = async (e) => {
    e.preventDefault();

    if (!rating) {
      alert("Please select a star rating");
      return;
    }

    try {
      setSubmittingReview(true);

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.post(
        `${API}/api/reviews`,
        {
          order_id: order._id,
          rating,
          comment
        },
        { headers }
      );

      setReview(res.data);
      setRating(0);
      setComment("");
    } catch (err) {
      console.error("Review submit error:", err);
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="customer-dashboard">
        <Header />
        <div className="cd-layout">
          <CustomerSidebar user={user} activeItem="orders" />
          <main className="cd-main d-flex align-items-center justify-content-center">
            <div className="spinner-border text-success" />
          </main>
        </div>
      </div>
    );
  }

  const stepIndex = statusToStepIndex(order.status);
  const listing = order.vendor_listing_id || {};
  const imageUrl = listing.image_url ? `${API}/${listing.image_url}` : "/placeholder.jpg";

  const estimatedDate = order.estimated_delivery
    ? new Date(order.estimated_delivery).toLocaleDateString()
    : "TBD";

  return (
    <div className="customer-dashboard">
      <Header />
      <div className="cd-layout">
        <CustomerSidebar user={user} activeItem="orders" />
        <main className="cd-main order-track-main">
          <div className="ot-chip-row mb-2">
            <span className={`ot-status-chip ot-status-${order.status}`}>
              <span
                className="material-symbols-outlined me-1"
                style={{ fontSize: 18 }}
              >
                task_alt
              </span>
              {order.status === "pending" && "Order Placed"}
              {order.status === "confirmed" && "Order Confirmed"}
              {order.status === "shipped" && "Order Shipped"}
              {order.status === "delivered" && "Order Delivered"}
              {order.status === "cancelled" && "Order Cancelled"}
            </span>
          </div>

          <div className="card ot-meta-card mb-4 shadow-sm border-0">
            <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <div className="small text-muted">ORDER ID</div>
                <div className="ot-meta-id">
                  {order._id.slice(-6).toUpperCase()}
                </div>
              </div>
              <div>
                <div className="small text-muted">ORDER DATE</div>
                <div className="ot-meta-text">
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="small text-muted">ESTIMATED DELIVERY</div>
                <div className="ot-meta-text">{estimatedDate}</div>
              </div>
              <button
                className="btn btn-outline-success d-flex align-items-center gap-1 ms-auto"
                onClick={() => navigate("/customer/orders")}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18 }}
                >
                  list_alt
                </span>
                Manage Order
              </button>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card ot-card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <span className="material-symbols-outlined me-2 text-success">
                      timeline
                    </span>
                    <h6 className="mb-0">Delivery Timeline</h6>
                  </div>

                  <div className="ot-timeline">
                    {STEP_CONFIG.map((step, idx) => {
                      const completed = idx <= stepIndex;
                      return (
                        <div className="ot-step" key={step.key}>
                          <div
                            className={`ot-step-icon ${completed ? "ot-step-icon-complete" : ""
                              }`}
                          >
                            <span className="material-symbols-outlined">
                              {completed ? "check_circle" : step.icon}
                            </span>
                          </div>
                          {idx < STEP_CONFIG.length - 1 && (
                            <div
                              className={`ot-step-line ${idx < stepIndex ? "ot-step-line-complete" : ""
                                }`}
                            />
                          )}
                          <div className="ot-step-label">{step.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="card ot-card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="mb-3">Order Summary</h6>
                  <div className="d-flex gap-3 mb-3">
                    <div className="ot-summary-image">
                      <img src={imageUrl} alt={listing.title} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="ot-summary-title">{listing.title}</div>
                      {listing.condition && (
                        <div className="ot-summary-sub text-muted">
                          {listing.condition}
                        </div>
                      )}
                      <div className="ot-summary-sub text-muted">
                        Qty: {order.quantity}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="ot-summary-price">
                        Rs {order.subtotal?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Subtotal</span>
                    <span>Rs {order.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Shipping</span>
                    <span>Rs {order.shipping_fee?.toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mt-2">
                    <span className="fw-semibold">Total Amount</span>
                    <span className="fw-bold text-success fs-6">
                      Rs {order.total?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {order.status === "delivered" && !review && (
                <div className="card ot-card shadow-sm border-0 mt-4">
                  <div className="card-body">
                    <h6 className="mb-3">Leave a Review</h6>
                    <form onSubmit={submitReview}>
                      <div className="mb-3">
                        <label className="form-label d-block">Your Rating</label>
                        <div className="d-flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className="btn p-0 border-0 bg-transparent"
                              onClick={() => setRating(star)}
                              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: 32,
                                  color: star <= rating ? "#f5b301" : "#d1d5db"
                                }}
                              >
                                star
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Short Review</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          maxLength="300"
                          placeholder="Share your experience with this spare part"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={submittingReview}
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {order.status === "delivered" && review && (
                <div className="card ot-card shadow-sm border-0 mt-4">
                  <div className="card-body">
                    <h6 className="mb-3">Your Review</h6>
                    <div className="mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 24,
                            color: star <= review.rating ? "#f5b301" : "#d1d5db"
                          }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    {review.comment && (
                      <p className="mb-0 text-muted">{review.comment}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="col-lg-4">

              <div className="card ot-care-card border-0">
                <div className="card-body text-white">
                  <h6 className="mb-2">SpareCeylon Care</h6>
                  <p className="small mb-3">
                    Enjoy dedicated support and quick replacements for damaged
                    spare parts.
                  </p>
                  <button className="btn btn-light btn-sm">
                    View Coverage Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderTracking;