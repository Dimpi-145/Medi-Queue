import React, { useEffect, useState } from "react";

import toast from "react-hot-toast";

import {
  getMyReports,
  getSharedReports,
  getReportRequests,
  fulfillPatientReportRequest,
  deleteReport,
  renameReport,
  uploadReport,
} from "../services/report.api";

import "./Report.scss";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [requestFiles, setRequestFiles] = useState({});

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("Other");
  const [hospitalName, setHospitalName] = useState("");
  const [sendingRequestId, setSendingRequestId] = useState("");
  const [renamingReportId, setRenamingReportId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  /* ================= FETCH REPORTS ================= */
  const fetchReports = async () => {
    try {
      setLoading(true);

      const [myRes, sharedRes, requestRes] = await Promise.allSettled([
        getMyReports(),
        getSharedReports(),
        getReportRequests(),
      ]);

      const myReports =
        myRes.status === "fulfilled" && Array.isArray(myRes.value?.data?.data)
          ? myRes.value.data.data
              .filter((item) => !item.originRequestId)
              .map((item) => ({ ...item, reportSource: "own" }))
          : [];

      const sharedReports =
        sharedRes.status === "fulfilled" &&
        Array.isArray(sharedRes.value?.data?.data)
          ? sharedRes.value.data.data.map((item) => ({
              ...item,
              reportSource: "received",
            }))
          : [];

      const reportRequests =
        requestRes.status === "fulfilled" &&
        Array.isArray(requestRes.value?.data?.data)
          ? requestRes.value.data.data
          : [];

      setReports([...sharedReports, ...myReports]);
      setRequests(reportRequests);
    } catch (err) {
      console.error("Reports Fetch Error:", err);

      setReports([]);
      setRequests([]);

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

  const handleRequestFileChange = (requestId, fileObj) => {
    if (!fileObj) {
      setRequestFiles((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      return;
    }

    setRequestFiles((prev) => ({
      ...prev,
      [requestId]: fileObj,
    }));
  };

  const handleFulfillRequest = async (item) => {
    const selectedFile = requestFiles[item._id];

    if (!selectedFile) {
      return toast.error("Please choose a file for this request");
    }

    try {
      setSendingRequestId(item._id);

      const formData = new FormData();
      formData.append("report", selectedFile);
      if (item.reportType) {
        formData.append("reportType", item.reportType);
      }
      if (item.fileName) {
        formData.append("fileName", item.fileName);
      }
      if (item.hospitalName) {
        formData.append("hospitalName", item.hospitalName);
      }

      await fulfillPatientReportRequest(item._id, formData);

      toast.success("Request fulfilled successfully");

      setRequestFiles((prev) => {
        const next = { ...prev };
        delete next[item._id];
        return next;
      });

      fetchReports();
    } catch (err) {
      console.error("Fulfill Request Error:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.details ||
        err?.message;
      toast.error(serverMsg || "Failed to fulfill request");
    } finally {
      setSendingRequestId("");
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
      if (reportName && reportName.trim())
        formData.append("fileName", reportName.trim());
      if (reportType) formData.append("reportType", reportType);
      if (hospitalName && hospitalName.trim())
        formData.append("hospitalName", hospitalName.trim());

      await uploadReport(formData);

      toast.success("Report uploaded successfully!");

      setFile(null);
      setReportName("");
      setReportType("Other");
      setHospitalName("");

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

          <div className="upload-meta">
            <input
              type="text"
              placeholder="Report name (optional)"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="report-name-input"
            />

            <input
              type="text"
              placeholder="Hospital name (optional)"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="hospital-name-input"
            />

            <select
              className="report-type-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option>Lab Test</option>
              <option>X-Ray</option>
              <option>CT Scan</option>
              <option>Blood Test</option>
              <option>ECG</option>
              <option>Prescription</option>
              <option>Other</option>
            </select>

            <div className="upload-date">
              Upload Date: {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="upload-actions">
            <label className="custom-file-upload">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const f = e.target.files[0];
                  setFile(f);
                  if (f && !reportName) {
                    const name = f.name.replace(/\.[^/.]+$/, "");
                    setReportName(name);
                  }
                }}
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
      ) : (
        <>
          {requests.length > 0 && (
            <div
              className="panel-panel request-panel"
              style={{ marginBottom: 20 }}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Pending Requests</p>
                  <h2>Report Requests</h2>
                </div>
              </div>

              <div className="report-grid">
                {requests
                  .filter(
                    (item) => !(item.status === "fulfilled" && !item.reportId),
                  )
                  .map((item) => (
                    <div key={item._id} className="report-card">
                      <div className="report-top">
                        <div className="report-badge">REQ</div>
                        <span className="received-tag">Request</span>
                        <span className="report-date">
                          {new Date(item.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>

                      <div className="report-body">
                        <h4>{item.reportType || "Report Request"}</h4>
                        <p>
                          {item.hospitalId?.hospitalName
                            ? `Requested by ${item.hospitalId.hospitalName}`
                            : item.doctorId?.username
                              ? `Requested by Dr. ${item.doctorId.username}`
                              : "Report request"}
                        </p>
                      </div>

                      <div className="report-footer">
                        <div
                          className="report-actions"
                          style={{ flexWrap: "wrap", gap: "10px" }}
                        >
                          <span className="secondary-button">
                            {item.status || "pending"}
                          </span>

                          {item.status === "fulfilled" &&
                            item.reportId?.fileUrl && (
                              <a
                                href={item.reportId.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="secondary-button"
                              >
                                View Report
                              </a>
                            )}
                        </div>

                        {item.status === "pending" && (
                          <div className="request-fulfill-box">
                            <label className="request-file-label">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) =>
                                  handleRequestFileChange(
                                    item._id,
                                    e.target.files[0],
                                  )
                                }
                              />
                              Choose File
                            </label>

                            <button
                              type="button"
                              className="upload-button"
                              onClick={() => handleFulfillRequest(item)}
                              disabled={sendingRequestId === item._id}
                            >
                              {sendingRequestId === item._id
                                ? "Sending..."
                                : "Send"}
                            </button>

                            {requestFiles[item._id]?.name && (
                              <span className="selected-file">
                                Selected: {requestFiles[item._id].name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {reports.length === 0 ? (
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
                    <div className="report-badge">
                      {getFileType(item.fileUrl)}
                    </div>

                    {item.reportSource === "received" && (
                      <span className="received-tag">Received</span>
                    )}

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

                    <p>
                      {item.reportSource === "received"
                        ? `${item.reportType || "Report"} • ${item.hospitalId?.hospitalName || item.hospitalName || "Hospital"}`
                        : `${item.reportType || "Healthcare Document"}${item.hospitalName ? ` • ${item.hospitalName}` : ""}`}
                    </p>
                  </div>

                  <div className="report-footer">
                    {item.reportSource === "own" &&
                    renamingReportId === item._id ? (
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

                        {item.reportSource === "own" && (
                          <>
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
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default Reports;
