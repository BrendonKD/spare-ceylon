import React from "react";
import "./styles/AboutUs.css";
import Header from "../components/header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

import { FaStore, FaShieldAlt } from "react-icons/fa";
import { MdVerified, MdBuild } from "react-icons/md";

const AboutUs = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FaStore />,
      title: "Trusted Marketplace",
      text: "Spare Ceylon connects customers and vendors in one reliable platform for automotive spare parts.",
    },
    {
      icon: <MdBuild />,
      title: "Easy Part Discovery",
      text: "We make it easier to search, explore, and find the right vehicle parts with less effort.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Confidence & Trust",
      text: "Our goal is to create a better buying experience with clear information and secure interactions.",
    },
  ];

  const handleContactClick = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    navigate("/customer/inquire");
  };

  const handleExploreClick = () => {
    navigate("/parts");
  };

  const handleVendorClick = () => {
    navigate("/register/vendor");
  };

  return (
    <>
      <Header />

      <main className="about-page">
        <section className="about-hero">
          <div className="container">
            <div className="about-hero-content text-center">
              <h1>About Spare Ceylon</h1>

              <p>
                Spare Ceylon is a modern automotive e-commerce platform built to
                connect customers with trusted vendors and make spare parts buying
                simpler, faster, and more convenient in Sri Lanka.
              </p>

              <div className="about-actions">
                <button type="button" className="about-btn-primary" onClick={handleExploreClick}>
                  Explore Products
                </button>

                <button type="button" className="about-btn-outline" onClick={handleContactClick}>
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="about-intro">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 text-center">
                <h2>Built for a better spare parts experience</h2>
                <p>
                  We aim to improve how people discover and purchase automotive
                  spare parts by bringing quality listings, trusted sellers, and a
                  user-friendly marketplace into one digital platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-features">
          <div className="container">
            <div className="row g-4">
              {features.map((item, index) => (
                <div className="col-md-4" key={index}>
                  <div className="feature-card h-100 text-center">
                    <div className="feature-icon">{item.icon}</div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="about-cta">
          <div className="container">
            <div className="cta-box text-center">
              <MdVerified className="cta-icon" />
              <h2>Your trusted spare parts marketplace</h2>
              <p>
                Spare Ceylon is focused on making automotive part sourcing easier
                for customers while helping vendors grow through a modern online platform.
              </p>

              <button type="button" className="about-btn-primary" onClick={handleVendorClick}>
                Become a Vendor
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default AboutUs;