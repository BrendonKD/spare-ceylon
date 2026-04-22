import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import "./Checkout.css";

const API = "http://localhost:5000";


const Checkout = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState({
    listing: null,
    quantity: 1,
    shippingAddress: { fullName: "", address: "", city: "", phone: "" },
    paymentMethod: "cod",
    subtotal: 0,
    shippingFee: 900,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);


  useEffect(() => {
    const loadListing = async () => {
      if (!listingId) return navigate('/');
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/public/listing/${listingId}`);
        if (!res.ok) throw new Error('Listing not found');
        const listing = await res.json();
        setOrderData(prev => ({
          ...prev,
          listing,
          subtotal: listing.price,
          total: listing.price + 900
        }));
      } catch (err) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    loadListing();
  }, [listingId, navigate]);

  // Handle Card Payment --> Stripe Gateway
  const handleCardPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API}/api/orders/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          listingId,
          quantity: orderData.quantity,
          shipping_address: orderData.shippingAddress
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment setup failed');
      }

      if (!data.url) {
        throw new Error('Stripe checkout URL not returned');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Payment error:', err);
      alert(err.message || 'Payment failed. Please try again.');
    }
  };

  const handleQuantityChange = (qty) => {
    qty = Math.max(1, Math.min(qty, orderData.listing?.quantity_available || 1));
    const subtotal = orderData.listing.price * qty;
    setOrderData(prev => ({ ...prev, quantity: qty, subtotal, total: subtotal + orderData.shippingFee }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [name]: value }
    }));
  };

  const handlePaymentChange = (method) => {
    setOrderData(prev => ({ ...prev, paymentMethod: method }));
  };

  // Handle both Card & COD payments
  const handleSubmit = async (e) => {
    e.preventDefault();

    // If Card selected → Go to Stripe
    if (orderData.paymentMethod === 'card') {
      await handleCardPayment();
      return;
    }

    // COD flow 
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          vendor_listing_id: listingId,
          quantity: orderData.quantity,
          shipping_address: orderData.shippingAddress,
          payment_method: orderData.paymentMethod,
          subtotal: orderData.subtotal,
          shipping_fee: orderData.shippingFee,
          total: orderData.total
        })
      });
      if (res.ok) {
        alert('Order placed successfully!');
        navigate('/orders');
      } else {
        const error = await res.json();
        alert(error.message || 'Order failed');
      }
    } catch (err) {
      alert('Order failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !orderData.listing) {
    return (
      <div className="checkout-page">
        <Header />
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="spinner-border text-success" style={{ width: '3rem', height: '3rem' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Header />
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Complete your order</h1>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-grid">
            <div className="checkout-left">
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
                    <div className="address-name">{orderData.shippingAddress.fullName || "Add address"}</div>
                    <div className="address-details">
                      {orderData.shippingAddress.address || orderData.shippingAddress.city}
                    </div>
                  </div>
                ) : (
                  <>
                    <input name="fullName" placeholder="Full name" className="form-control mb-2"
                      value={orderData.shippingAddress.fullName} onChange={handleAddressChange} required />
                    <input name="address" placeholder="Street address" className="form-control mb-2"
                      value={orderData.shippingAddress.address} onChange={handleAddressChange} required />
                    <div className="row">
                      <div className="col-8">
                        <input name="city" placeholder="City" className="form-control"
                          value={orderData.shippingAddress.city} onChange={handleAddressChange} required />
                      </div>
                      <div className="col-4">
                        <input name="phone" type="tel" placeholder="Phone" className="form-control"
                          value={orderData.shippingAddress.phone} onChange={handleAddressChange} required />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="checkout-section">
                <h3 className="section-title">
                  <span className="material-icons-outlined">payments</span>
                  Payment method
                </h3>
                <div className="payment-methods">
                  {/* Card now goes to Stripe */}
                  <label className={`payment-item ${orderData.paymentMethod === 'card' ? 'active' : ''}`}>
                    <input type="radio" name="payment" value="card"
                      checked={orderData.paymentMethod === 'card'}
                      onChange={() => handlePaymentChange('card')}
                      className="form-check-input me-3" />
                    <div className="payment-icon">💳</div>
                    <div>
                      <div className="payment-title">Credit/Debit Card</div>
                      <div className="payment-desc">Secure Stripe payment • Visa, MC, Amex</div>
                    </div>
                  </label>
                  <label className={`payment-item ${orderData.paymentMethod === 'cod' ? 'active' : ''}`}>
                    <input type="radio" name="payment" value="cod"
                      checked={orderData.paymentMethod === 'cod'}
                      onChange={() => handlePaymentChange('cod')}
                      className="form-check-input me-3" />
                    <div className="payment-icon">💰</div>
                    <div>
                      <div className="payment-title">Cash on Delivery</div>
                      <div className="payment-desc">Pay when delivered</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="checkout-section">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>{orderData.listing.vendor?.name || "Store"}</h5>
                </div>
                <div className="product-card">
                  <div className="product-img">
                    <img src={orderData.listing.image_url ? `${API}/${orderData.listing.image_url}` : '/placeholder.jpg'}
                      alt={orderData.listing.title} />
                  </div>
                  <div className="product-details">
                    <h6 className="product-title">{orderData.listing.title}</h6>
                    {orderData.listing.condition && <p className="text-muted small mb-2">{orderData.listing.condition}</p>}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="product-price">LKR {orderData.listing.price.toLocaleString()}</div>
                      <div className="quantity-controls">
                        <button type="button" className="qty-btn" onClick={() => handleQuantityChange(orderData.quantity - 1)}>-</button>
                        <input type="number" min="1" max={orderData.listing.quantity_available}
                          value={orderData.quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                          className="qty-input" />
                        <button type="button" className="qty-btn" onClick={() => handleQuantityChange(orderData.quantity + 1)}>+</button>
                      </div>
                    </div>
                    <div className="shipping-info">
                      <div><strong>Shipping:</strong> LKR {orderData.shippingFee.toLocaleString()}</div>
                      <div><strong>Delivery:</strong> Apr 16</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="checkout-right">
              <h3 className="section-title mb-3">
                <span className="material-icons-outlined">receipt_long</span>
                Order Summary
              </h3>
              <div className="summary-item">
                <span>Subtotal ({orderData.quantity}x)</span>
                <span>LKR {orderData.subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span>Shipping</span>
                <span>LKR {orderData.shippingFee.toLocaleString()}</span>
              </div>
              <hr className="my-2" />
              <div className="summary-item summary-total">
                <strong>Total</strong>
                <strong>LKR {orderData.total.toLocaleString()}</strong>
              </div>
              {/* MODIFIED: Dynamic button text */}
              <button type="submit" className="btn-place-order"
                disabled={submitting || !orderData.shippingAddress.fullName}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processing...
                  </>
                ) : orderData.paymentMethod === 'card' ? (
                  'Pay with Card (Secure)'
                ) : (
                  'Place COD Order'
                )}
              </button>
              <p className="legal-text">
                By placing order, you agree to ournTerms & Conditions
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;