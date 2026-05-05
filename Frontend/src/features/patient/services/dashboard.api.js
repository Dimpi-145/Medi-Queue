import axios from "axios";

const api = axios.create({
  baseURL: "/api/Dashboard",
  withCredentials: true,
});

export const getPatientDashboard = () => api.get("/patient");