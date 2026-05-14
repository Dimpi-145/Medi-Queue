import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// ================= TOKEN =================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ================= HOSPITAL =================
export const getPatients = () =>
  api.get("/hospital/getpatients");

export const getDoctors = () =>
  api.get("/hospital/getdoctors");

export const createPatient = (data) =>
  api.post("/hospital/create-patient", data);

export const createDoctor = (data) =>
  api.post("/hospital/create-doctor", data);

// ================= APPOINTMENTS =================
export const getAppointments = () =>
  api.get("/hospital/appointments");

export const bookAppointment = (data) =>
  api.post("/hospital/book-appointment", data);

export const getMyAppointments = () =>
  api.get("/hospital/my-appointments");

// ================= DOCTOR FILTER (PATIENT SIDE) =================
export const getDoctorsByDepartment = (department) =>
  api.get(`/hospital/get-doctors?department=${department}`);

// ================= DASHBOARD =================
export const getDashboardStats = () =>
  api.get("/hospital/stats");

// ================= QUEUE =================
export const getLiveQueue = (doctorId) =>
  api.get(`/queue/live${doctorId ? `?doctorId=${doctorId}` : ""}`);

export const addToQueue = (data) =>
  api.post("/queue/hospital/add-to-queue", data);

// ================= PRESCRIPTIONS =================
export const getPrescriptions = () =>
  api.get("/prescriptions/all");

// ================= REPORTS =================
export const getReports = () =>
  api.get("/reports/all");

export default api;