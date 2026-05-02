import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/Dashboard",
  withCredentials: true,
});

export const getPatientDashboard = () => api.get("/patient");