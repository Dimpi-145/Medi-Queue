import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Report.scss";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ================= FETCH REPORTS =================
  const fetchReports = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:3000/api/reports/my",
        { withCredentials: true }
      );

      setReports(res.data || []);
    } catch (err) {
      console.error("Reports Fetch Error:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // ================= UPLOAD REPORT =================
  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("report", file);

      const res = await axios.post(
        "http://localhost:3000/api/reports/upload",
        formData,
        {
          withCredentials: true,
        }
      );

      alert("Report uploaded successfully!");

      setFile(null);
      fetchReports();

    } catch (err) {
      console.error("Upload Error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="card-panel reports-panel">

      {/* HEADER */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Medical Records</p>
          <h2>Reports</h2>
        </div>
      </div>

      {/* UPLOAD BOX */}
      <div className="upload-box">

        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload Report"}
        </button>

      </div>

      {/* LOADING */}
      {loading ? (
        <div className="panel-empty">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="panel-empty">No reports available.</div>
      ) : (
        <div className="report-list">

          {reports.map((item) => (
            <div key={item._id} className="report-row">

              <div>
                <h4>{item.title || "Medical Report"}</h4>
                <p>{item.type || "File"}</p>
              </div>

              <div className="report-meta">
                <span>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>

                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="secondary-button"
                >
                  View
                </a>
              </div>

            </div>
          ))}

        </div>
      )}

    </section>
  );
};

export default Reports;