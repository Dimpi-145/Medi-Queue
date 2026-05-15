import axios from "../../../utils/axios";

// Create hospital report
export const createHospitalReport = (formData) => {
  return axios.post("/admin/create-report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Get hospital's reports
export const getHospitalReports = () => {
  return axios.get("/admin/reports");
};

// Share report with doctor
export const shareReportWithDoctor = (data) => {
  return axios.post("/admin/share-report-doctor", data);
};

// Share report with patient
export const shareReportWithPatient = (data) => {
  return axios.post("/admin/share-report-patient", data);
};

// Get shared reports (for doctor/patient)
export const getSharedReports = () => {
  return axios.get("/admin/shared-reports");
};

// Get incoming report requests for the hospital
export const getHospitalReportRequests = () => {
  return axios.get("/admin/report-requests");
};

// Fulfill a report request with an uploaded report file
export const fulfillHospitalReportRequest = (requestId, formData) => {
  return axios.post(`/admin/report-requests/${requestId}/fulfill`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Get hospital's patients
export const getHospitalPatients = () => {
  return axios.get("/admin/getpatients");
};

// Get hospital's doctors
export const getHospitalDoctors = () => {
  return axios.get("/admin/getdoctors");
};

// Get hospital profile
export const getHospitalProfile = () => {
  return axios.get("/admin/hospital-profile");
};

// Update hospital profile
export const updateHospitalProfile = (data) => {
  return axios.put("/admin/hospital-profile", data);
};
