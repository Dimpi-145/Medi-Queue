import API from "../../../utils/axios";

// BOOK
export const bookAppointment = (data) => API.post("/appointments/book", data);

// GET DOCTORS
export const getDoctors = (department) =>
  API.get(`/appointments/get-doctors?department=${department}`);

// GET MY APPOINTMENTS
export const getMyAppointments = () => API.get("/appointments/my");
export const getMyHistory = () => API.get("/appointments/history");

// GET APPOINTMENT HISTORY
export const getAppointmentHistory = () => API.get("/appointments/history");

// CANCEL
export const cancelAppointment = (id) => API.put(`/appointments/cancel/${id}`);

// RESCHEDULE
export const rescheduleAppointment = (appointmentId, newDate, newTimeSlot) =>
  API.post(`/appointments/reschedule`, {
    appointmentId,
    newDate,
    newTimeSlot,
  });
