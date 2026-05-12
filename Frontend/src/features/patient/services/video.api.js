import axios from "../../../utils/axios";

// Request video consultation

export const requestVideoConsultation = (
  appointmentId
) => {

  return axios.post(
    "/video/request",
    {
      appointmentId,
    }
  );
};

// Doctor responds to request

export const respondToVideoRequest = (
  videoRequestId,
  action
) => {

  return axios.post(
    "/video/respond",
    {
      videoRequestId,
      action,
    }
  );
};

// Get all video requests

export const getVideoRequests = (
  status = "pending"
) => {

  return axios.get(
    "/video/requests",
    {
      params: { status },
    }
  );
};

// Get request status for appointment

export const getVideoRequestStatus = (
  appointmentId
) => {

  return axios.get(
    `/video/status/${appointmentId}`
  );
};

// Cancel video consultation request

export const cancelVideoConsultation = (
  appointmentId
) => {
  return axios.post(
    `/video/cancel`,
    {
      appointmentId,
    }
  );
};