import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Header from "../components/header";
import VendorSidebar from "../components/VendorSidebar";
import "./styles/VendorSubscriptions.css";

const API = "http://localhost:5000";

const VendorSubscriptions = () => {
  const [vendor, setVendor] = useState({ full_name: "Loading...", email: "...", business_name: "", logo_url: "" });

  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState("basic");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);



  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const [plansRes, subRes, profileRes] = await Promise.all([
          axios.get(`${API}/api/subscriptions/plans`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/api/subscriptions/my-subscription`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setPlans(plansRes.data);

        const currentSub = subRes.data.subscription;
        if (currentSub?.plan_id?.slug) {
          setCurrentPlan(currentSub.plan_id.slug);
        } else {
          setCurrentPlan("basic");
        }

        setVendor({
          full_name: profileRes.data.full_name || "",
          email: profileRes.data.email || "",
          business_name:profileRes.data.business_name || "",
          logo_url: profileRes.data.logo_url
          ? `${API}/${profileRes.data.logo_url.replace(/^\/+/, "")}`
          : ""
        });
      } catch (err) {
        console.error("Failed to load subscription data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const uiPlans = useMemo(() => {
    return plans.map((plan) => {
      const yearlyPrice =
        plan.price_monthly > 0 ? Math.round(plan.price_monthly * 12 * 0.85) : 0;

      let color = "#0E544F";
      if (plan.slug === "pro") color = "#EB7623";
      if (plan.slug === "premium") color = "#8D183A";

      let badge = "Plan";
      if (plan.slug === "basic") badge = "Free Plan";
      if (plan.slug === "pro") badge = "Most Popular";
      if (plan.slug === "premium") badge = "Advanced";

      return {
        ...plan,
        id: plan.slug,
        price: plan.price_monthly,
        yearlyPrice,
        period: "/month",
        badge,
        color,
        recommended: !!plan.is_recommended
      };
    });
  }, [plans]);

  const handlePlanSelect = async (plan) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first");
        return;
      }

      setProcessingPlan(plan.slug);

      if (plan.is_free || plan.price_monthly === 0) {
        const res = await axios.post(
          `${API}/api/subscriptions/activate-free`,
          {
            plan_id: plan._id,
            billing_cycle: billingCycle
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setCurrentPlan(plan.slug);
        alert(res.data.message);
        return;
      }

      const res = await axios.post(
        `${API}/api/subscriptions/create-checkout-session`,
        {
          plan_id: plan._id,
          billing_cycle: billingCycle
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      window.location.href = res.data.url;
    } catch (err) {
      console.error("Subscription error:", err);
      alert(err.response?.data?.message || "Failed to process subscription");
    } finally {
      setProcessingPlan(null);
    }
  };

  const formatPrice = (plan) => {
    if (plan.price === 0) return "Free";
    if (billingCycle === "yearly") {
      return `Rs. ${plan.yearlyPrice.toLocaleString()}`;
    }
    return `Rs. ${plan.price.toLocaleString()}`;
  };

  return (
    <div className="vendor-subscriptions-page">
      <Header />

      <div className="vs-layout">
        <VendorSidebar vendor={vendor} activeItem="subscription-plans" />

        <main className="vs-main">
          <div className="vs-hero card border-0 shadow-sm">
            <div className="card-body p-4 p-lg-5">
              <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
                <div>
                  <span className="vs-eyebrow">Vendor Growth Plans</span>
                  <h2 className="vs-title mb-2">Choose the subscription that fits your business</h2>
                  <p className="vs-subtitle mb-0">
                    Compare features, unlock better visibility, and scale your spare parts business with the right plan.
                  </p>
                </div>

                <div className="vs-billing-toggle">
                  <button
                    className={`vs-toggle-btn ${billingCycle === "monthly" ? "active" : ""}`}
                    onClick={() => setBillingCycle("monthly")}
                  >
                    Monthly
                  </button>
                  <button
                    className={`vs-toggle-btn ${billingCycle === "yearly" ? "active" : ""}`}
                    onClick={() => setBillingCycle("yearly")}
                  >
                    Yearly
                    <span className="vs-save-badge">Save 15%</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="vs-current-plan card border-0 shadow-sm mt-4">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <div className="vs-section-label">Current Subscription</div>
                  <h5 className="mb-1 text-capitalize">{currentPlan} Plan</h5>
                  <p className="text-muted mb-0">Manage your current vendor access level and benefits.</p>
                </div>
                <span className="vs-current-pill text-capitalize">{currentPlan} Active</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">Loading plans...</div>
          ) : (
            <div className="row g-4 mt-1">
              {uiPlans.map((plan) => {
                const isCurrent = currentPlan === plan.slug;

                return (
                  <div className="col-xl-4 col-lg-6" key={plan._id}>
                    <div className={`card vs-plan-card border-0 shadow-sm h-100 ${plan.recommended ? "recommended" : ""}`}>
                      <div className="card-body p-4 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <span
                              className="vs-plan-badge"
                              style={{ backgroundColor: `${plan.color}15`, color: plan.color }}
                            >
                              {plan.badge}
                            </span>
                            <h4 className="vs-plan-name mt-3 mb-1">{plan.name}</h4>
                          </div>
                          {plan.recommended && <span className="vs-popular-tag">Popular</span>}
                        </div>

                        <p className="text-muted vs-plan-desc">{plan.description}</p>

                        <div className="vs-price-wrap">
                          <span className="vs-price">{formatPrice(plan)}</span>
                          {plan.price > 0 && (
                            <span className="vs-period">
                              {billingCycle === "yearly" ? "/year" : plan.period}
                            </span>
                          )}
                        </div>

                        <ul className="vs-feature-list list-unstyled mt-4 mb-4">
                          {plan.features.map((feature, index) => (
                            <li key={index}>
                              <span className="material-symbols-outlined">check_circle</span>
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <button
                          className={`btn mt-auto ${isCurrent ? "btn-outline-secondary" : "vs-plan-btn"}`}
                          style={!isCurrent ? { backgroundColor: plan.color, borderColor: plan.color, color: "#fff" } : {}}
                          onClick={() => handlePlanSelect(plan)}
                          disabled={isCurrent || processingPlan === plan.slug}
                        >
                          {isCurrent
                            ? "Current Plan"
                            : processingPlan === plan.slug
                              ? "Processing..."
                              : plan.price === 0
                                ? "Activate Free Plan"
                                : `Pay & Activate ${plan.name}`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card vs-feature-compare border-0 shadow-sm mt-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <h5 className="mb-0">Plan Comparison</h5>
                <span className="text-muted small">Quick overview of what each plan includes</span>
              </div>

              <div className="table-responsive">
                <table className="table align-middle mb-0 vs-compare-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Basic</th>
                      <th>Pro</th>
                      <th>Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Active Listings</td>
                      <td>25</td>
                      <td>200</td>
                      <td>Unlimited</td>
                    </tr>
                    <tr>
                      <td>Vendor Badge</td>
                      <td>No</td>
                      <td>Yes</td>
                      <td>Priority Badge</td>
                    </tr>
                    <tr>
                      <td>Analytics</td>
                      <td>Basic</td>
                      <td>Standard</td>
                      <td>Advanced</td>
                    </tr>
                    <tr>
                      <td>Support</td>
                      <td>Community</td>
                      <td>Priority Email</td>
                      <td>Dedicated Support</td>
                    </tr>
                    <tr>
                      <td>Promotions</td>
                      <td>No</td>
                      <td>Campaign Access</td>
                      <td>Homepage + Ad Credits</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorSubscriptions;