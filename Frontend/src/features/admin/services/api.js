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

// ================= ADMIN =================
export const getPatients = () =>
  api.get("/admin/getpatients");

export const getDoctors = () =>
  api.get("/admin/getdoctors");

export const createPatient = (data) =>
  api.post("/admin/create-patient", data);

export const createDoctor = (data) =>
  api.post("/admin/create-doctor", data);

// ================= APPOINTMENTS =================
export const getAppointments = () =>
  api.get("/admin/appointments");

export const bookAppointment = (data) =>
  api.post("/admin/book-appointment", data);

export const getMyAppointments = () =>
  api.get("/appointments/my");

// ================= DOCTOR FILTER (PATIENT SIDE) =================
export const getDoctorsByDepartment = (department) =>
  api.get(`/appointments/get-doctors?department=${department}`);

// ================= DASHBOARD =================
export const getDashboardStats = () =>
  api.get("/admin/stats");

// ================= QUEUE =================
export const getLiveQueue = (doctorId) =>
  api.get(`/queue/live${doctorId ? `?doctorId=${doctorId}` : ""}`);

export const addToQueue = (data) =>
  api.post("/queue/admin/add-to-queue", data);

// ================= PRESCRIPTIONS =================
export const getPrescriptions = () =>
  api.get("/prescriptions/all");

export default api;