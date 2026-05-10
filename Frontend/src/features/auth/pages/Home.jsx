import React from "react";
import { useNavigate } from "react-router-dom";
import "../style/home.scss";

const Home = () => {
  const navigate = useNavigate();

  return (
    <main className="home-page">
      <section className="home-brand-panel">
        <h1 className="brand-title">QURE</h1>
        <p className="brand-copy">
          The modern hospital queue management system connecting patients,
          doctors, and administration.
        </p>
        <p className="brand-footer">(c) 2026 Qure Healthcare</p>
      </section>

      <section className="home-portal-panel">
        <h2>Welcome to QURE</h2>
        <p className="subtitle">Select your portal to continue</p>

        <button
          className="portal-card"
          type="button"
          onClick={() => navigate("/login", { state: { portal: "patient" } })}
        >
          <div className="icon patient">P</div>
          <div className="content">
            <h3>Patient Portal</h3>
            <p>Book appointments, track queue and view vault</p>
          </div>
          <span className="arrow">-&gt;</span>
        </button>

        <button
          className="portal-card"
          type="button"
          onClick={() => navigate("/login", { state: { portal: "doctor" } })}
        >
          <div className="icon doctor">D</div>
          <div className="content">
            <h3>Doctor Portal</h3>
            <p>Manage patient queue and generate prescriptions</p>
          </div>
          <span className="arrow">-&gt;</span>
        </button>
      </section>
    </main>
  );
};

export default Home;
