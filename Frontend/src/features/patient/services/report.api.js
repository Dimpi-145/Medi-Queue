import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/reports",
  withCredentials: true,
});

// Upload report
export const uploadReport = (data) =>
  api.post("/upload", data);

// Get patient reports
export const getMyReports = () =>
  api.get("/my");

// Doctor view by token
export const getReportByToken = (token) =>
  api.get(`/view/${token}`);