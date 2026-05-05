import axios from "axios";

const api = axios.create({
  baseURL: "/api/appointments",
  withCredentials: true,
});

// BOOK
export const bookAppointment = (data) =>
  api.post("/book", data);

//get-doctors
export const getDoctors = (department) =>
  api.get(`/get-doctors?department=${department}`);

// GET MY APPOINTMENTS
export const getMyAppointments = () =>
  api.get("/my");

// CANCEL
export const cancelAppointment = (id) =>
  api.put(`/cancel/${id}`);