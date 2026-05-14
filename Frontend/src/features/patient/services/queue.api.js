import axios from "axios";

const api = axios.create({
  baseURL: "/api/queue",
  withCredentials: true,
});

export const getQueuePosition = (appointmentId) =>
  api.get(`/position/${appointmentId}`);