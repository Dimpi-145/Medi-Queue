import API from "../../../utils/axios";

export const getDoctorSharedReports = () => {
  return API.get("/admin/shared-reports");
};

export const requestReport = (payload) => {
  return API.post("/doctor/request-report", payload);
};

export const getDoctorRequests = () => {
  return API.get("/doctor/requests");
};

export const getHospitals = () => {
  return API.get("/auth/hospitals");
};
