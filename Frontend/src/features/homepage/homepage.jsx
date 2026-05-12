import React from "react";
import "./homepage.scss";
import logo from "../../assets/logo.png";
import { Link } from "react-router-dom";

const Homepage = () => {
  return (
    <div className="home-container">

      {/* NAVBAR */}
      <nav className="home-navbar">

        <div className="nav-links">
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="logo">
          <img src={logo} alt="MediQueue" />
        </div>

        <div className="nav-actions">
          <a href="/login" className="btn-outline">Login</a>
          <a href="/register" className="btn-primary">Register</a>
        </div>

      </nav>

      {/* HERO */}
      <section className="hero">
        <h1>Smart Queue Management for Healthcare</h1>

        <p>
          Book appointments, track queues in real-time, and manage patients efficiently.
        </p>

        <a href="/register" className="btn-primary hero-btn">
          Get Started
        </a>
      </section>

      {/* SERVICES */}
      <section id="services" className="features">

        <div className="feature-card">
          <h3>⚡ Fast Booking</h3>
          <p>Instant appointment booking with real-time availability.</p>
        </div>

        <div className="feature-card">
          <h3>📊 Live Queue</h3>
          <p>Track your queue position without waiting physically.</p>
        </div>

        <div className="feature-card">
          <h3>🏥 Smart Dashboard</h3>
          <p>Doctors and admins manage patients efficiently.</p>
        </div>

      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <h2>About MediQueue</h2>

        <p>
          MediQueue helps hospitals and clinics reduce waiting time, improve patient flow,
          and deliver better healthcare experiences using smart queue management.
        </p>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section">
        <h2>Contact Us</h2>

        <p>
          Email:{" "}
          <Link to="/support" className="support-link">
            mediqueue876@gmail.com
          </Link>
        </p>

        <p>Phone: +91 XXXXX XXXXX</p>
      </section>

    </div>
  );
};

export default Homepage;