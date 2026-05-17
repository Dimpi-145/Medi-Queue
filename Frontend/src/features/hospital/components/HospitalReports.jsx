import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  FileText,
  Upload,
  Share2,
  User,
  Trash2,
  Download,
  X,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { authContext } from "../../auth/auth.context";
import {
  createHospitalReport,
  getHospitalReports,
  getHospitalReportRequests,
  fulfillHospitalReportRequest,
  shareReportWithDoctor,
  shareReportWithPatient,
  getHospitalPatients,
  getHospitalDoctors,
} from "../services/hospital.api";
import "./HospitalReports.scss";
import { resolveAttachmentUrl } from "../../../utils/attachmentUrl";

const HospitalReports = () => {
  const { user } = useContext(authContext);
  const [activeTab, setActiveTab] = useState("create");
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestFiles, setRequestFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [sendingRequestId, setSendingRequestId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [patientSearchInput, setPatientSearchInput] = useState("");
  const [reportTypeInput, setReportTypeInput] = useState("all");
  const [appliedPatientSearch, setAppliedPatientSearch] = useState("");
  const [appliedReportType, setAppliedReportType] = useState("all");
  const [sortMode, setSortMode] = useState("date");

  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    patientName: "",
    fileName: "",
    reportType: "Other",
    description: "",
    doctorId: "",
  });

  const [shareModal, setShareModal] = useState({ open: false, reportId: null });
  const [shareData, setShareData] = useState({
    shareWithDoctor: false,
    doctorId: "",
    patientId: "",
  });

  useEffect(() => {
    if (activeTab === "create") {
      fetchPatients();
      fetchDoctors();
    } else if (activeTab === "list") {
      fetchReports();
      if (!doctors.length) {
        fetchDoctors();
      }
    } else if (activeTab === "requests") {
      fetchReportRequests();
    }
  }, [activeTab]);

  const fetchPatients = async () => {
    try {
      const res = await getHospitalPatients();
      setPatients(res.data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await getHospitalDoctors();
      setDoctors(res.data || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getHospitalReports();
      setReports(Array.isArray(res.data?.data) ? res.data.data : []);
      setError("");
    } catch (err) {
      setError("Failed to fetch reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await getHospitalReportRequests();
      setRequests(Array.isArray(res.data?.data) ? res.data.data : []);
      setError("");
    } catch (err) {
      setError("Failed to fetch report requests");
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRequestFileChange = (requestId, selectedFile) => {
    setRequestFiles((prev) => ({
      ...prev,
      [requestId]: selectedFile,
    }));
  };

  const handleFulfillRequest = async (request) => {
    const selectedFile = requestFiles[request._id];

    if (!selectedFile) {
      setError("Please choose a file for this request");
      return;
    }

    try {
      setSendingRequestId(request._id);
      setError("");

      const data = new FormData();
      data.append("file", selectedFile);
      data.append("fileName", selectedFile.name);

      await fulfillHospitalReportRequest(request._id, data);

      setSuccess("Report request fulfilled and sent successfully!");
      setRequestFiles((prev) => {
        const next = { ...prev };
        delete next[request._id];
        return next;
      });

      await fetchReportRequests();
      await fetchReports();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send request report");
    } finally {
      setSendingRequestId("");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    const normalizedName = formData.patientName.trim().toLowerCase();

    if (!file || !normalizedName) {
      setError("Please enter a valid patient name and choose a file");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = new FormData();
      data.append("file", file);
      data.append("patientName", formData.patientName.trim());
      data.append("fileName", formData.fileName || file.name);
      data.append("reportType", formData.reportType);
      data.append("description", formData.description);
      if (formData.doctorId) {
        data.append("doctorId", formData.doctorId);
      }

      await createHospitalReport(data);
      setSuccess("Report created successfully!");
      setFile(null);
      setFormData({
        patientName: "",
        fileName: "",
        reportType: "Other",
        description: "",
        doctorId: "",
      });
      setTimeout(() => setSuccess(""), 3000);
      await fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShareModal = (reportId) => {
    setShareModal({ open: true, reportId });
    setShareData({ shareWithDoctor: false, doctorId: "", patientId: "" });
  };

  const handleShareReport = async () => {
    if (shareData.shareWithDoctor) {
      if (!shareData.doctorId) {
        setError("Please select a doctor");
        return;
      }
    } else if (!shareData.patientId.trim()) {
      setError("Please enter a valid Patient ID/User ID");
      return;
    }

    try {
      setLoading(true);
      if (shareData.shareWithDoctor) {
        await shareReportWithDoctor({
          reportId: shareModal.reportId,
          doctorId: shareData.doctorId,
        });
        setSuccess("Report sent to doctor reports section!");
      } else {
        await shareReportWithPatient({
          reportId: shareModal.reportId,
          patientId: shareData.patientId.trim(),
        });
        setSuccess("Report sent to patient reports section!");
      }

      setShareModal({ open: false, reportId: null });
      fetchReports();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to share report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      if (!report?.fileUrl) throw new Error("No file URL");

      const resolved = resolveAttachmentUrl(report.fileUrl);
      const response = await fetch(resolved, { credentials: "include" });

      if (!response.ok) throw new Error("Unable to download file");

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = report.fileName || "report";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download report error:", err);
      toast.error(
        "Unable to download file. It may be missing from the server.",
      );
    }
  };

  const handleRunSearch = () => {
    setAppliedPatientSearch(patientSearchInput.trim());
    setAppliedReportType(reportTypeInput);
  };

  const openReportFile = async (fileUrl) => {
    if (!fileUrl) return toast.error("No file available");

    try {
      const resolved = resolveAttachmentUrl(fileUrl);
      const res = await fetch(resolved, { credentials: "include" });
      if (!res.ok) throw new Error("Unable to fetch file");
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Open report error:", err);
      toast.error("Unable to load file. It may be missing from the server.");
    }
  };

  const handleResetSearch = () => {
    setPatientSearchInput("");
    setReportTypeInput("all");
    setAppliedPatientSearch("");
    setAppliedReportType("all");
  };

  const reportTypeOptions = useMemo(() => {
    const uniqueTypes = new Set(
      reports.map((report) => String(report.reportType || "Other")),
    );
    return [
      "all",
      ...Array.from(uniqueTypes).sort((a, b) => a.localeCompare(b)),
    ];
  }, [reports]);

  const filteredReports = useMemo(() => {
    const normalizedPatientSearch = appliedPatientSearch.trim().toLowerCase();

    const matchingReports = reports.filter((report) => {
      const patientName = String(
        report.patientId?.username || report.patientName || "",
      ).toLowerCase();
      const reportType = String(report.reportType || "Other");

      const patientMatches = normalizedPatientSearch
        ? patientName.includes(normalizedPatientSearch)
        : true;
      const typeMatches =
        appliedReportType === "all" ? true : reportType === appliedReportType;

      return patientMatches && typeMatches;
    });

    return [...matchingReports].sort((a, b) => {
      if (sortMode === "alphabetical") {
        return String(a.fileName || "").localeCompare(String(b.fileName || ""));
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [reports, appliedPatientSearch, appliedReportType, sortMode]);

  return (
    <div className="hospital-reports">
      <div className="reports-header">
        <h2>Report Management</h2>
        <p>Create and manage patient medical reports</p>
      </div>

      <div className="reports-tabs">
        <button
          className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          <Upload size={18} />
          Create Report
        </button>
        <button
          className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          <FileText size={18} />
          All Reports
        </button>
        <button
          className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          <User size={18} />
          Report Requests
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {activeTab === "create" && (
        <div className="report-form-container">
          <form onSubmit={handleCreateReport} className="report-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="patientName">Patient Name *</label>
                <input
                  id="patientName"
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  placeholder="Enter patient name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reportType">Report Type *</label>
                <select
                  id="reportType"
                  name="reportType"
                  value={formData.reportType}
                  onChange={handleInputChange}
                >
                  <option value="Lab Test">Lab Test</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="Blood Test">Blood Test</option>
                  <option value="ECG">ECG</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="fileName">File Name</label>
                <input
                  id="fileName"
                  type="text"
                  name="fileName"
                  value={formData.fileName}
                  onChange={handleInputChange}
                  placeholder="e.g., Lab Results 2024"
                />
              </div>

              <div className="form-group">
                <label htmlFor="doctorId">Assign to Doctor (Optional)</label>
                <select
                  id="doctorId"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleInputChange}
                >
                  <option value="">No specific doctor</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.username} - {d.specialization}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add any notes about this report..."
                rows={3}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="file">Upload File *</label>
              <div className="file-input-wrapper">
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                <span className="file-name">
                  {file ? file.name : "Choose a file..."}
                </span>
              </div>
              <small>
                Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 5MB)
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Report"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "list" && (
        <div className="reports-list-container">
          <div className="reports-toolbar">
            <div className="search-group">
              <label htmlFor="reportSearch">Search by Patient Name</label>
              <input
                id="reportSearch"
                type="text"
                value={patientSearchInput}
                onChange={(e) => setPatientSearchInput(e.target.value)}
                placeholder="Enter patient name"
              />

              <label htmlFor="reportTypeFilter">Report Type</label>
              <select
                id="reportTypeFilter"
                value={reportTypeInput}
                onChange={(e) => setReportTypeInput(e.target.value)}
              >
                {reportTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Report Types" : type}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="reportSort">Filter / Sort</label>
              <select
                id="reportSort"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
              >
                <option value="date">By Date</option>
                <option value="alphabetical">Alphabetically</option>
              </select>

              <button
                type="button"
                className="search-btn"
                onClick={handleRunSearch}
              >
                Search
              </button>

              <button
                type="button"
                className="reset-btn"
                onClick={handleResetSearch}
              >
                Reset
              </button>
            </div>
          </div>

          {loading ? (
            <p className="loading">Loading reports...</p>
          ) : filteredReports.length === 0 ? (
            <p className="empty">
              No reports found for the selected search criteria
            </p>
          ) : (
            <div className="reports-grid">
              {filteredReports.map((report) => (
                <div key={report._id} className="report-card">
                  <div className="report-header">
                    <div className="report-title">
                      <FileText size={24} />
                      <div>
                        <h3>{report.fileName}</h3>
                        <p className="report-type">{report.reportType}</p>
                      </div>
                    </div>
                  </div>

                  <div className="report-info">
                    <div className="info-row">
                      <span className="label">Patient:</span>
                      <span className="value">
                        {report.patientId?.username ||
                          report.patientName ||
                          "Unknown"}
                      </span>
                    </div>
                    <div className="info-row full">
                      <span className="label">File:</span>
                      <span className="value">
                        {report.fileName ? (
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => openReportFile(report.fileUrl)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              color: "inherit",
                              cursor: "pointer",
                            }}
                          >
                            {report.fileName}
                          </button>
                        ) : (
                          "No file name available"
                        )}
                      </span>
                    </div>
                    {report.doctorId && (
                      <div className="info-row">
                        <span className="label">Doctor:</span>
                        <span className="value">
                          {report.doctorId?.username}
                        </span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="label">Date:</span>
                      <span className="value">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {report.description && (
                      <div className="info-row full">
                        <span className="label">Notes:</span>
                        <span className="value">{report.description}</span>
                      </div>
                    )}
                  </div>

                  <div className="report-sharing">
                    <div className="shared-with">
                      {report.sharedWith.length > 0 ? (
                        <>
                          <span className="label">Shared with:</span>
                          {report.sharedWith.map((share, idx) => (
                            <span
                              key={idx}
                              className={`badge badge-${share.role}`}
                            >
                              {share.role === "doctor" ? "Doctor" : "Patient"}
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className="label empty">Not shared yet</span>
                      )}
                    </div>
                  </div>

                  <div className="report-actions">
                    <button
                      className="action-btn download"
                      onClick={() => handleDownloadReport(report)}
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button
                      className="action-btn share"
                      onClick={() => handleOpenShareModal(report._id)}
                    >
                      <Share2 size={16} />
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="reports-list-container">
          <div className="reports-toolbar">
            <div className="search-group">
              <label>Incoming Requests</label>
              <p>
                Report requests sent by doctors to this hospital are shown here.
              </p>
            </div>
          </div>

          {loadingRequests ? (
            <p className="loading">Loading report requests...</p>
          ) : requests.length === 0 ? (
            <p className="empty">No report requests found</p>
          ) : (
            <div className="reports-grid">
              {requests.map((request) => (
                <div key={request._id} className="report-card">
                  <div className="report-header">
                    <div className="report-title">
                      <FileText size={24} />
                      <div>
                        <h3>{request.reportType || "Report Request"}</h3>
                        <p className="report-type">Request</p>
                      </div>
                    </div>
                  </div>

                  <div className="report-info">
                    <div className="info-row">
                      <span className="label">Doctor:</span>
                      <span className="value">
                        {request.doctorId?.username || "Doctor"}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Patient:</span>
                      <span className="value">
                        {request.patientId?.username ||
                          request.patientName ||
                          "Unknown"}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Status:</span>
                      <span className="value">
                        {request.status || "pending"}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Date:</span>
                      <span className="value">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {request.description && (
                      <div className="info-row full">
                        <span className="label">Notes:</span>
                        <span className="value">{request.description}</span>
                      </div>
                    )}
                  </div>

                  <div className="report-footer">
                    <div
                      className="report-actions"
                      style={{ flexWrap: "wrap", gap: "10px" }}
                    >
                      <span className="secondary-button">
                        {request.status || "pending"}
                      </span>
                    </div>

                    {request.status === "pending" && (
                      <div className="request-fulfill-box">
                        <label className="request-file-label">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) =>
                              handleRequestFileChange(
                                request._id,
                                e.target.files[0],
                              )
                            }
                          />
                          Choose File
                        </label>

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleFulfillRequest(request)}
                          disabled={sendingRequestId === request._id}
                        >
                          {sendingRequestId === request._id
                            ? "Sending..."
                            : "Send"}
                        </button>

                        {requestFiles[request._id]?.name && (
                          <span className="selected-file">
                            Selected: {requestFiles[request._id].name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {shareModal.open && (
        <div
          className="modal-overlay"
          onClick={() => setShareModal({ open: false, reportId: null })}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Share Report</h3>
              <button
                className="close-btn"
                onClick={() => setShareModal({ open: false, reportId: null })}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="share-options">
                <label className="option">
                  <input
                    type="radio"
                    name="shareTarget"
                    checked={!shareData.shareWithDoctor}
                    onChange={() =>
                      setShareData({
                        shareWithDoctor: false,
                        doctorId: "",
                        patientId: "",
                      })
                    }
                  />
                  <span>Share with Patient</span>
                </label>

                <label className="option">
                  <input
                    type="radio"
                    name="shareTarget"
                    checked={shareData.shareWithDoctor}
                    onChange={() =>
                      setShareData({
                        ...shareData,
                        shareWithDoctor: true,
                        patientId: "",
                      })
                    }
                  />
                  <span>Share with Doctor</span>
                </label>
              </div>

              {!shareData.shareWithDoctor && (
                <div className="form-group">
                  <label htmlFor="sharePatientId">Patient ID / User ID</label>
                  <input
                    id="sharePatientId"
                    type="text"
                    value={shareData.patientId}
                    onChange={(e) =>
                      setShareData({ ...shareData, patientId: e.target.value })
                    }
                    placeholder="Enter registered patient ID"
                  />
                </div>
              )}

              {shareData.shareWithDoctor && (
                <div className="form-group">
                  <label htmlFor="shareDoctorId">Select Doctor</label>
                  <select
                    id="shareDoctorId"
                    value={shareData.doctorId}
                    onChange={(e) =>
                      setShareData({ ...shareData, doctorId: e.target.value })
                    }
                  >
                    <option value="">Choose a doctor...</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.username} - {d.specialization}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleShareReport}
                disabled={loading}
              >
                <Check size={16} />
                {loading ? "Sending..." : "Send Report"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShareModal({ open: false, reportId: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalReports;
