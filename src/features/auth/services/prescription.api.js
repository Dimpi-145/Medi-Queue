import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/prescriptions",
  withCredentials: true,
});

export const createPrescription = (data) =>
  api.post("/create", data);

export const getMyPrescriptions = () =>
  api.get("/my");