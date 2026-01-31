import React from "react";
import "./Home.css";
import Header from "../components/header.js";

const Home = () => {
  return ( 
    <div className="home-page">
      <Header />
      {/* Hero / Search section */}
      <section className="hero-section">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-10">
              <h1 className="hero-title">
                Find the Perfect Auto Parts
              </h1>
              <p className="hero-subtitle">
                Search from verified Sri Lankan vendors by part name, vehicle or image.
              </p>

              {/* Search bar row */}
              <div className="hero-search-wrapper">
                <div className="input-group flex-wrap">
                  <input
                    type="text"
                    className="form-control hero-search-input"
                    placeholder="Search by part name or vehicle model"
                  />
                  <button className="btn btn-primary">
                    Search
                  </button>
                </div>

                {/* Filter chips */}
                <div className="hero-filters mt-3 d-flex flex-wrap justify-content-center">
                  <button className="btn btn-sm btn-outline-light me-2 mb-2">
                    Engine
                  </button>
                  <button className="btn btn-sm btn-outline-light me-2 mb-2">
                    Suspension
                  </button>
                  <button className="btn btn-sm btn-outline-light me-2 mb-2">
                    Electrical
                  </button>
                  <button className="btn btn-sm btn-outline-light me-2 mb-2">
                    Body Parts
                  </button>
                </div>

                {/* Toggle row */}
                <div className="hero-toggle-row d-flex flex-wrap justify-content-center mt-3">
                  <span className="toggle-label me-2">Filter by:</span>
                  <button className="btn btn-sm btn-outline-light me-2 mb-2">
                    Part Name
                  </button>
                  <button className="btn btn-sm btn-outline-light me-2 mb-2">
                    Vehicle
                  </button>
                  <button className="btn btn-sm btn-outline-light mb-2">
                    Upload Image
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Promo cards below hero */}
          <div className="row mt-4 g-3">
            <div className="col-md-6">
              <div className="promo-card promo-left d-flex align-items-end">
                <div>
                  <h5>Engine Deals</h5>
                  <p>Up to 40% off selected brands</p>
                  <button className="btn btn-outline-light btn-sm">
                    Shop Now
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="promo-card promo-right d-flex align-items-end">
                <div>
                  <h5>Grand Opening Sale</h5>
                  <p>Save on OEM & genuine parts</p>
                  <button className="btn btn-outline-light btn-sm">
                    Shop Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending & newly listed */}
      <section className="section-padding">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
            <h2 className="section-title mb-2">
              Trending & Newly Listed Parts
            </h2>
            <button className="btn p-0">
              View All
            </button>
          </div>

          <div className="row g-3">
            {[1, 2, 3, 4].map((card) => (
              <div className="col-12 col-sm-6 col-lg-3" key={card}>
                <div className="card part-card h-100">
                  <div className="part-card-image" />
                  <div className="card-body">
                    <h6 className="card-title mb-1">Toyota Timing Belt</h6>
                    <p className="card-text small mb-1 text-muted">
                      Genuine • Colombo Spare Center
                    </p>
                    <p className="card-text small mb-2">
                      ⭐ 4.8 • 120+ orders
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="price-tag">LKR 8,900</span>
                      <button className="btn btn-sm btn-outline-primary">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified vendors */}
      <section className="section-padding bg-light">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
            <h2 className="section-title mb-2">Verified Vendors</h2>
            <button className="btn p-0">
              View All Vendors
            </button>
          </div>

          <div className="row g-3">
            {[1, 2, 3, 4].map((vendor) => (
              <div className="col-12 col-sm-6 col-lg-3" key={vendor}>
                <div className="card vendor-card h-100 text-center">
                  <div className="vendor-avatar mx-auto mb-2" />
                  <div className="card-body">
                    <h6 className="card-title mb-1">Lanka Spare Centre</h6>
                    <p className="small mb-1 text-muted">
                      Colombo • 250+ orders
                    </p>
                    <p className="small mb-2">⭐ 4.9 • Verified</p>
                    <button className="btn btn-sm btn-outline-primary w-100">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community highlights */}
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
                      Posted by K.D. Brown • 2h ago
                    </p>
                    <p className="small mb-2">
                      Discussion on common issues and recommended spare parts
                      for city driving conditions.
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

      {/* Why choose / feature cards */}
      <section className="section-padding why-section">
        <div className="container text-center">
          <h2 className="section-title mb-3">Why Choose Spare Ceylon?</h2>
          <p className="section-subtitle mb-4">
            Sri Lanka’s trusted marketplace for genuine and verified auto parts.
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

      {/* Footer */}
      <footer className="footer-section">
        <div className="container text-center">
          <p className="mb-0 small text-light">
            © {new Date().getFullYear()} Spare Ceylon. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
