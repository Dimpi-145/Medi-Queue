import API from "../../../utils/axios";

// BOOK
export const bookAppointment = (data) => API.post("/appointments/book", data);

// GET DOCTORS
export const getDoctors = ({ hospitalId = "", department = "" } = {}) => {
  const params = [];
  if (hospitalId) params.push(`hospitalId=${hospitalId}`);
  if (department) params.push(`department=${department}`);
  return API.get(
    `/appointments/get-doctors${params.length ? `?${params.join("&")}` : ""}`,
  );
};

// GET MY APPOINTMENTS
export const getMyAppointments = () => API.get("/appointments/my");

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
