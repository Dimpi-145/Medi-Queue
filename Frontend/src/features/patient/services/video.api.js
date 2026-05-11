import axios from "../../../utils/axios";

export const requestVideoConsultation = (appointmentId) => {
  return axios.post("/video/request", {
    appointmentId,
  });
};

export const respondToVideoRequest = (videoRequestId, action) => {
  return axios.post("/video/respond", {
    videoRequestId,
    action,
  });
};

export const getVideoRequests = (status = "pending") => {
  return axios.get("/video/requests", {
    params: { status },
  });
};

export const getVideoRequestStatus = (appointmentId) => {
  return axios.get(`/video/status/${appointmentId}`);
};

export const respondToVideoRequest = (videoRequestId, action) => {
  return axios.post("/video/respond", {
    videoRequestId,
    action,
  });
};
