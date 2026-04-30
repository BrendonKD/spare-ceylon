import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import { useCart } from "../context/CartContext";
import "./CartCheckout.css";

const API = "http://localhost:5000";

const CartCheckout = () => {
  const navigate = useNavigate();
  const { items, clearCart, getCartSummary } = useCart();

  const summary = useMemo(() => getCartSummary(), [items]);
  const [submitting, setSubmitting] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const validateAddress = () => {
    return (
      shippingAddress.fullName &&
      shippingAddress.address &&
      shippingAddress.city &&
      shippingAddress.phone
    );
  };

  const handleCODCheckout = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/orders/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartItems: items,
          shipping_address: shippingAddress,
          payment_method: "cod",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Cart order failed");
      }

      clearCart();
      alert("Orders placed successfully!");
      navigate("/customer/orders");
    } catch (err) {
      console.error(err);
      alert(err.message || "Cart checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardCheckout = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/orders/create-cart-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartItems: items,
          shipping_address: shippingAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Payment setup failed");
      }

      if (!data.url) {
        throw new Error("Stripe checkout URL not returned");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert(err.message || "Card checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!items.length) {
      alert("Your cart is empty");
      return;
    }

    if (!validateAddress()) {
      alert("Please fill all shipping address fields");
      return;
    }

    if (paymentMethod === "card") {
      await handleCardCheckout();
    } else {
      await handleCODCheckout();
    }
  };

  if (!items.length) {
    return (
      <div className="cart-checkout-page">
        <Header />
        <div className="container py-5">
          <div className="alert alert-light border text-center">
            <h4 className="mb-2">Your cart is empty</h4>
            <button
              className="btn btn-success"
              onClick={() => navigate("/parts")}
            >
              Browse Parts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-checkout-page">
      <Header />

      <div className="container py-4">
        <div className="cart-checkout-header mb-4">
          <h2 className="mb-1">Cart Checkout</h2>
          <p className="text-muted mb-0">
            Review items grouped by vendor. Delivery fee is charged per vendor.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <h5 className="mb-3">Shipping Address</h5>
                  <div className="row g-3">
                    <div className="col-12">
                      <input
                        name="fullName"
                        className="form-control"
                        placeholder="Full Name"
                        value={shippingAddress.fullName}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <input
                        name="address"
                        className="form-control"
                        placeholder="Street Address"
                        value={shippingAddress.address}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        name="city"
                        className="form-control"
                        placeholder="City"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        name="phone"
                        className="form-control"
                        placeholder="Phone"
                        value={shippingAddress.phone}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <h5 className="mb-3">Payment Method</h5>

                  <label className={`payment-box ${paymentMethod === "cod" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                    />
                    <span>Cash on Delivery</span>
                  </label>

                  <label className={`payment-box ${paymentMethod === "card" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                    />
                    <span>Credit / Debit Card</span>
                  </label>
                </div>
              </div>

              {summary.grouped.map((group) => (
                <div className="card shadow-sm border-0 mb-4" key={group.vendorId}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <h5 className="mb-0">{group.vendorName}</h5>
                      <span className="badge bg-light text-dark border">
                        {group.items.length} item(s)
                      </span>
                    </div>

                    {group.items.map((item) => (
                      <div key={item._id} className="cart-line-item">
                        <div className="cart-line-image">
                          <img
                            src={
                              item.image_url
                                ? `${API}/${item.image_url.replace(/^\//, "")}`
                                : "/placeholder.jpg"
                            }
                            alt={item.title}
                          />
                        </div>

                        <div className="cart-line-info">
                          <div className="fw-semibold">
                            {item.title || item.product?.name}
                          </div>
                          <div className="small text-muted">
                            Qty: {item.qty}
                          </div>
                          <div className="small text-muted">
                            LKR {item.price?.toLocaleString()} each
                          </div>
                        </div>

                        <div className="cart-line-total">
                          LKR {((item.price || 0) * item.qty).toLocaleString()}
                        </div>
                      </div>
                    ))}

                    <hr />
                    <div className="d-flex justify-content-between small mb-2">
                      <span>Vendor Subtotal</span>
                      <span>LKR {group.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-2">
                      <span>Delivery Charge</span>
                      <span>LKR {group.shippingFee.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-semibold text-success">
                      <span>Vendor Total</span>
                      <span>LKR {group.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm border-0 cart-summary-sticky">
                <div className="card-body">
                  <h5 className="mb-3">Order Summary</h5>

                  <div className="d-flex justify-content-between mb-2">
                    <span>Items Subtotal</span>
                    <span>LKR {summary.subtotal.toLocaleString()}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span>Vendor Delivery Fees</span>
                    <span>LKR {summary.shipping.toLocaleString()}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span>Vendors</span>
                    <span>{summary.vendorCount}</span>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between fw-bold fs-5 text-success mb-3">
                    <span>Total</span>
                    <span>LKR {summary.total.toLocaleString()}</span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Processing..."
                      : paymentMethod === "card"
                        ? "Pay with Card"
                        : "Place COD Orders"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CartCheckout;