import React from 'react';
import './AboutUs.css';

const AboutUs = () => {
  const brandFeatures = [
    {
      title: "Best Price Guarantee",
      text: "Compare offers from multiple verified vendors in one place to get the best deal.",
      icon: "payments",
      color: "#FCBE30",
      label: "Affordability"
    },
    {
      title: "Trusted Community",
      text: "Peer reviews and ratings ensure only the highest-rated vendors thrive in our network.",
      icon: "groups",
      color: "#EB7623",
      label: "Network"
    },
    {
      title: "Verified Quality",
      text: "Every part undergoes a digital verification process against OEM standards for your safety.",
      icon: "verified_user",
      color: "#0E544F",
      label: "Security"
    }
  ];

  return (
    <div className="about-container">
      {/* Hero Header */}
      <section className="about-hero text-center">
        <div className="container">
          <h1 className="fw-bold mb-3">Why Choose <span className="text-teal">Spare Ceylon?</span></h1>
          <p className="lead text-muted mx-auto" style={{maxWidth: '700px'}}>
            Sri Lanka’s trusted marketplace for genuine and verified auto parts, 
            connecting you with reliability and quality.
          </p>
        </div>
      </section>

      {/* Horizontal Feature Cards */}
      <section className="container my-5">
        <div className="row g-4">
          {brandFeatures.map((item, index) => (
            <div className="col-lg-4" key={index}>
              <div className="horizontal-feature-card shadow-sm h-100">
                <div className="card-top-accent" style={{backgroundColor: item.color}}></div>
                <div className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <span className="material-symbols-outlined" style={{color: item.color, backgroundColor: `${item.color}15`}}>
                      {item.icon}
                    </span>
                    <span className="feature-label ms-auto" style={{color: item.color, borderColor: item.color}}>
                      {item.label}
                    </span>
                  </div>
                  <h4 className="card-title fw-bold">{item.title}</h4>
                  <p className="card-text text-muted">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vision & CTA */}
      <section className="container mt-5">
        <div className="cta-banner rounded-4 p-5 text-white text-center">
          <h2 className="fw-bold mb-4">Join Our Growing Community</h2>
          <div className="d-flex justify-content-center gap-3">
            <button className="btn btn-maroon px-4 py-2 fw-bold">Browse Parts</button>
            <button className="btn btn-outline-light px-4 py-2">Contact Us</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;