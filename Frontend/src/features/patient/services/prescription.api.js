import axios from "axios";

const api = axios.create({
  baseURL: "/api/prescriptions",
  withCredentials: true,
});

// Get patient prescriptions
export const getMyPrescriptions = () =>
  api.get("/my");
