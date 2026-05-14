import React, { useState, useEffect } from "react";
import { getReports } from "../services/api";
import { FileText, Clock2 } from "lucide-react";
import "./Reports.scss";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getReports();
        setReports(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(
          err.response?.data?.message || err.message || "Unable to load reports"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Medical Reports</h2>
          <p>Review patient reports and diagnostic files.</p>
        </div>
      </div>

      {loading && <div className="panel-empty">Loading reports...</div>}

      {!loading && error && (
        <div className="panel-error">{error}</div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="panel-empty">No reports found.</div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="reports-table">
          <div className="table-row header-row">
            <span>Patient</span>
            <span>Filename</span>
            <span>Uploaded</span>
            <span>Status</span>
          </div>
          {reports.map((report) => (
            <div className="table-row" key={report._id}>
              <span>{report.patientId?.username || "Unknown"}</span>
              <span>{report.fileName || "Report"}</span>
              <span>
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
              <span className="status">
                <FileText size={14} />
                {report.storageType === "local" ? "Local" : "Saved"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
