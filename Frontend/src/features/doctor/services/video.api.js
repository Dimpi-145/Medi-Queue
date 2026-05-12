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
