// pages/AdminDashboard.jsx

import React from "react";
import {
  Activity,
  Bell,
  FileText,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

import Header from "../components/Header";

import "../AdminDashboard.scss";

const adminCards = [
  {
    title: "Access Control",
    value: "12 roles",
    icon: <ShieldCheck size={22} />,
    note: "Review permissions and account policies",
  },
  {
    title: "Staff Accounts",
    value: "48 active",
    icon: <Users size={22} />,
    note: "Manage administrators and support staff",
  },
  {
    title: "Notifications",
    value: "7 pending",
    icon: <Bell size={22} />,
    note: "Pending system alerts and approvals",
  },
  {
    title: "Audit Logs",
    value: "Today",
    icon: <FileText size={22} />,
    note: "Track recent administrative activity",
  },
];

const actionItems = [
  "Review role assignments and account access",
  "Monitor system notices and overdue approvals",
  "Check audit trail for sensitive operations",
  "Update hospital-wide configuration policies",
];

const AdminDashboard = () => {
  return (
    <div className="admin-container">
      <div className="main">
        <Header />

        <div className="admin-hero">
          <div className="hero-left">
            <div className="hero-icon">
              <Settings2 size={22} />
            </div>

            <div>
              <p className="hero-eyebrow">MediQueue Administration</p>
              <h1>Admin Control Center</h1>
              <p className="hero-subtitle">
                Manage permissions, system settings, and oversight workflows.
              </p>
            </div>
          </div>

          <div className="hero-status">
            <Activity size={16} />
            System Active
          </div>
        </div>

        <div className="content">
          <section style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              {adminCards.map((card) => (
                <div
                  key={card.title}
                  style={{
                    background: "white",
                    borderRadius: "18px",
                    padding: "1.25rem",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.9rem",
                      background: "linear-gradient(135deg, #0f172a, #334155)",
                      color: "white",
                    }}
                  >
                    {card.icon}
                  </div>

                  <p
                    style={{ margin: 0, color: "#64748b", fontSize: "0.92rem" }}
                  >
                    {card.title}
                  </p>

                  <h3 style={{ margin: "0.35rem 0", fontSize: "1.6rem" }}>
                    {card.value}
                  </h3>

                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
                    {card.note}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              background: "white",
              borderRadius: "22px",
              padding: "1.5rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Admin Operations</h2>
                <p style={{ margin: "0.35rem 0 0", color: "#64748b" }}>
                  Centralized governance and operational oversight.
                </p>
              </div>

              <div
                style={{
                  padding: "0.6rem 0.9rem",
                  borderRadius: "999px",
                  background: "#f1f5f9",
                  color: "#0f172a",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Review queue
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.85rem",
              }}
            >
              {actionItems.map((item, index) => (
                <div
                  key={item}
                  style={{
                    padding: "1rem",
                    borderRadius: "16px",
                    background: index % 2 === 0 ? "#f8fafc" : "#eef2ff",
                    color: "#0f172a",
                    lineHeight: 1.55,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
