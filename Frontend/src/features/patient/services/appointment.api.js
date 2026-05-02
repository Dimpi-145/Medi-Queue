import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/appointments",
  withCredentials: true,
});

// BOOK
export const bookAppointment = (data) =>
  api.post("/book", data);

// GET MY APPOINTMENTS
export const getMyAppointments = () =>
  api.get("/my");

// CANCEL
export const cancelAppointment = (id) =>
  api.put(`/cancel/${id}`);