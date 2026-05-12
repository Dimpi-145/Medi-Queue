import axios from "../../../utils/axios";

export const getDoctorVideoRequests = (status = "pending") => {
  return axios.get("/video/requests", {
    params: { status },
  });
};

export const respondToVideoRequest = (videoRequestId, action) => {
  return axios.post("/video/respond", {
    videoRequestId,
    action,
  });
};

export const getVideoRequestStatus = (appointmentId) => {
  return axios.get(`/video/status/${appointmentId}`);
};

export const requestVideoConsultation = (appointmentId) => {
  return axios.post("/video/request", { appointmentId });
};

export const cancelVideoConsultation = (appointmentId) => {
  return axios.post("/video/cancel", { appointmentId });
};

export const endVideoCall = (videoRequestId) => {
  return axios.post("/video/end", { videoRequestId });
};
