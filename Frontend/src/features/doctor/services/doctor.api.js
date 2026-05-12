import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// GET doctor dashboard data
export const getDoctorDashboard = (date) =>
  API.get(`/Dashboard/doctor${date ? `?date=${date}` : ""}`);

// GET doctor appointments
export const getDoctorAppointments = (date) =>
  API.get(`/appointments/doctor${date ? `?date=${date}` : ""}`);

// GET doctor history
export const getDoctorHistory = () => API.get("/doctor/history");

// GET live queue
export const getLiveQueue = (doctorId, date) => {
  const params = [];
  if (doctorId) params.push(`doctorId=${doctorId}`);
  if (date) params.push(`date=${date}`);
  return API.get(`/queue/live${params.length ? `?${params.join("&")}` : ""}`);
};

export const callNextPatient = (date) =>
  API.put(`/queue/next${date ? `?date=${date}` : ""}`);

export const completeCurrent = (date) =>
  API.put(`/queue/complete${date ? `?date=${date}` : ""}`);