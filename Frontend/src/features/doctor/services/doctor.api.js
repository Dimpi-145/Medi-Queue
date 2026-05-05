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
export const getDoctorDashboard = () =>
  API.get("/Dashboard/doctor");

// GET doctor appointments
export const getDoctorAppointments = () =>
  API.get("/appointments/doctor");

// GET live queue
export const getLiveQueue = () =>
  API.get("/queue/live");