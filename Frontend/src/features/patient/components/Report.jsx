import React, { useEffect, useState } from "react";

import toast from "react-hot-toast";

import {
  getMyReports,
  deleteReport,
  renameReport,
  uploadReport,
} from "../services/report.api";

import "./Report.scss";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [renamingReportId, setRenamingReportId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  /* ================= FETCH REPORTS ================= */
  const fetchReports = async () => {
    try {
      setLoading(true);

      const res = await getMyReports();

      setReports(res.data.data || []);
    } catch (err) {
      console.error("Reports Fetch Error:", err);

      setReports([]);

      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  /* ================= FILE TYPE ================= */
  const getFileType = (name = "") => {
    if (name.toLowerCase().includes(".pdf")) {
      return "PDF";
    }

    return "Image";
  };

  const startRename = (item) => {
    setRenamingReportId(item._id);
    setRenameValue(item.fileName || item.title || "Medical Report");
  };

  const cancelRename = () => {
    setRenamingReportId(null);
    setRenameValue("");
  };

  const handleRename = async (item) => {
    if (!renameValue.trim()) {
      return toast.error("Please enter a file name");
    }

    try {
      await renameReport(item._id, { newFileName: renameValue });
      toast.success("Report renamed successfully");
      cancelRename();
      fetchReports();
    } catch (err) {
      console.error("Rename Error:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.details ||
        err?.message;
      toast.error(serverMsg || "Failed to rename report");
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete ${item.fileName || "this report"}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteReport(item._id);
      toast.success("Report deleted successfully");
      fetchReports();
    } catch (err) {
      console.error("Delete Error:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.details ||
        err?.message;
      toast.error(serverMsg || "Failed to delete report");
    }
  };

  /* ================= UPLOAD REPORT ================= */
  const handleUpload = async () => {
    if (!file) {
      return toast.error("Please select a file");
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("report", file);

      await uploadReport(formData);

      toast.success("Report uploaded successfully!");

      setFile(null);

      fetchReports();
    } catch (err) {
      console.error("Upload Error:", err);

      // Prefer server-provided message/details when available
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.details ||
        err?.message;
      console.error("Upload response data:", err?.response?.data);

      toast.error(serverMsg || "Failed to upload report");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="card-panel reports-panel">
      {/* ===== HEADER ===== */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Medical Records</p>

          <h2>Reports</h2>
        </div>

        <div className="report-count">{reports.length} Files</div>
      </div>

      {/* ===== UPLOAD SECTION ===== */}
      <div className="upload-card">
        <div className="upload-icon">☁</div>

        <div className="upload-content">
          <h3>Upload Medical Report</h3>

          <p>Upload PDFs, scans, prescriptions, or medical images securely.</p>

          <div className="upload-actions">
            <label className="custom-file-upload">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />
              Choose File
            </label>

            <button
              className="upload-button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Report"}
            </button>
          </div>

          {file && (
            <div className="selected-file">
              <span>Selected:</span>

              {file.name}
            </div>
          )}
        </div>
      </div>

      {/* ===== LOADING ===== */}
      {loading ? (
        <div className="panel-empty">Loading reports...</div>
      ) : reports.length === 0 ? (
        /* ===== EMPTY ===== */
        <div className="panel-empty reports-empty">
          <div className="empty-icon">📄</div>

          <h3>No Reports Uploaded</h3>

          <p>Your uploaded medical reports will appear here.</p>
        </div>
      ) : (
        /* ===== REPORT LIST ===== */
        <div className="report-grid">
          {reports.map((item) => (
            <div key={item._id} className="report-card">
              <div className="report-top">
                <div className="report-badge">{getFileType(item.fileUrl)}</div>

                <span className="report-date">
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="report-body">
                <h4>{item.fileName || item.title || "Medical Report"}</h4>

                <p>{item.type || "Healthcare Document"}</p>
              </div>

              <div className="report-footer">
                {renamingReportId === item._id ? (
                  <div className="rename-panel">
                    <input
                      className="rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      placeholder="New file name"
                    />

                    <div className="rename-actions">
                      <button
                        type="button"
                        className="secondary-button rename-save-button"
                        onClick={() => handleRename(item)}
                      >
                        Save Name
                      </button>

                      <button
                        type="button"
                        className="rename-cancel-button"
                        onClick={cancelRename}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="report-actions">
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary-button"
                    >
                      View Report
                    </a>

                    <button
                      type="button"
                      className="rename-button"
                      onClick={() => startRename(item)}
                    >
                      Rename
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Reports;
