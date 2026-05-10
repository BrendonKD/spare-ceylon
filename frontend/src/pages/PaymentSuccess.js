import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/header";
import "./styles/PaymentSuccess.css";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const method = searchParams.get("method") || "card";

  return (
    <div className="payment-success-page">
      <Header />

      <div className="success-container">
        <div className="success-card">
          <div className="success-icon">
            <span className="material-symbols-outlined">
              check_circle
            </span>
          </div>
          <h1>Payment Successful</h1>
          <p className="success-message">
            Your payment was successfully made via {method}.
          </p>
          <p className="success-subtext">
            Thank you for your purchase. Your order is being processed.
          </p>

          <button
            className="browse-btn"
            onClick={() => navigate("/customer/orders")}
          >
            Track The Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;