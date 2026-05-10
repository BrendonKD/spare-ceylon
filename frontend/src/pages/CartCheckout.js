import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import { useCart } from "../context/CartContext";
import "./styles/Checkout.css";
const API = "http://localhost:5000";

const CartCheckout = () => {
  const navigate = useNavigate();
  const { items, clearCart, getCartSummary } = useCart();
  const summary = useMemo(() => getCartSummary(), [items]);
  
  const [submitting, setSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
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

  const handleCODCheckout = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/orders/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cartItems: items,
          shipping_address: shippingAddress,
          payment_method: "cod",
        }),
      });

      if (res.ok) {
        clearCart();
        alert("Orders placed successfully!");
        navigate("/customer/orders");
      } else {
        const data = await res.json();
        alert(data.message || "Cart order failed");
      }
    } catch (err) {
      alert("Cart checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardCheckout = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/orders/create-cart-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cartItems: items, shipping_address: shippingAddress }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert("Card checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === "card") handleCardCheckout();
    else handleCODCheckout();
  };

  if (!items.length) {
    return (
      <div className="checkout-page">
        <Header />
        <div className="checkout-container text-center py-5">
          <h3>Your cart is empty</h3>
          <button className="browse-btn mt-3" onClick={() => navigate("/parts")}>Browse Parts</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Header />
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Cart Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-grid">
            <div className="checkout-left">
              
              {/* Shipping Section */}
              <div className="checkout-section">
                <div className="section-header">
                  <h3 className="section-title">
                    <span className="material-icons-outlined">local_shipping</span>
                    Shipping address
                  </h3>
                  <button type="button" className="btn-change" onClick={() => setShowAddressForm(!showAddressForm)}>
                    {showAddressForm ? 'Cancel' : 'Change'}
                  </button>
                </div>
                {!showAddressForm ? (
                  <div className="address-display">
                    <div className="address-name">{shippingAddress.fullName || "Add address"}</div>
                    <div className="address-details">
                      {shippingAddress.address} {shippingAddress.city ? `, ${shippingAddress.city}` : ""}
                    </div>
                  </div>
                ) : (
                  <div className="row g-2">
                    <div className="col-12">
                      <input name="fullName" placeholder="Full name" className="form-control" value={shippingAddress.fullName} onChange={handleAddressChange} required />
                    </div>
                    <div className="col-12">
                      <input name="address" placeholder="Street address" className="form-control" value={shippingAddress.address} onChange={handleAddressChange} required />
                    </div>
                    <div className="col-8">
                      <input name="city" placeholder="City" className="form-control" value={shippingAddress.city} onChange={handleAddressChange} required />
                    </div>
                    <div className="col-4">
                      <input name="phone" placeholder="Phone" className="form-control" value={shippingAddress.phone} onChange={handleAddressChange} required />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className="checkout-section">
                <h3 className="section-title">
                  <span className="material-icons-outlined">payments</span>
                  Payment method
                </h3>
                <div className="payment-methods">
                  <label className={`payment-item ${paymentMethod === 'card' ? 'active' : ''}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="form-check-input me-3" />
                    <div className="payment-icon">
                      <span className="material-icons-outlined">credit_card</span>
                    </div>
                    <div>
                      <div className="payment-title">Credit/Debit Card</div>
                      <div className="payment-desc">Secure Stripe payment</div>
                    </div>
                  </label>
                  <label className={`payment-item ${paymentMethod === 'cod' ? 'active' : ''}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="form-check-input me-3" />
                    <div className="payment-icon">
                      <span className="material-icons-outlined">payments</span>
                    </div>
                    <div>
                      <div className="payment-title">Cash on Delivery</div>
                      <div className="payment-desc">Pay when delivered</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Items Grouped by Vendor */}
              {summary.grouped.map((group) => (
                <div className="checkout-section" key={group.vendorId}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0" style={{fontSize: '1rem', fontWeight: '600'}}>{group.vendorName}</h5>
                    <span className="small text-muted">{group.items.length} items</span>
                  </div>
                  
                  {group.items.map((item) => (
                    <div className="product-card mb-2" key={item._id}>
                      <div className="product-img">
                        <img src={item.image_url ? `${API}/${item.image_url.replace(/^\//, "")}` : '/placeholder.jpg'} alt={item.title} />
                      </div>
                      <div className="product-details">
                        <h6 className="product-title">{item.title || item.product?.name}</h6>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="product-price" style={{fontSize: '0.95rem'}}>
                            LKR {item.price?.toLocaleString()} <span className="text-muted small">x {item.qty}</span>
                          </div>
                          <div className="fw-bold" style={{color: 'var(--primary-green)'}}>
                            LKR {(item.price * item.qty).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="shipping-info mt-2">
                    <div className="d-flex justify-content-between">
                      <span>Vendor Delivery Fee:</span>
                      <span>LKR {group.shippingFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Summary Sidebar */}
            <div className="checkout-right">
              <h3 className="section-title mb-3">
                <span className="material-icons-outlined">receipt_long</span>
                Order Summary
              </h3>
              <div className="summary-item">
                <span>Items Subtotal</span>
                <span>LKR {summary.subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span>Total Delivery Fee</span>
                <span>LKR {summary.shipping.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span>Total Vendors</span>
                <span>{summary.vendorCount}</span>
              </div>
              <hr className="my-2" />
              <div className="summary-item summary-total">
                <strong>Total Amount</strong>
                <strong>LKR {summary.total.toLocaleString()}</strong>
              </div>
              
              <button type="submit" className="btn-place-order" disabled={submitting || !shippingAddress.fullName}>
                {submitting ? "Processing..." : paymentMethod === 'card' ? 'Pay with Card' : 'Place COD Orders'}
              </button>
              <p className="legal-text">Secure transaction • Terms apply</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CartCheckout;