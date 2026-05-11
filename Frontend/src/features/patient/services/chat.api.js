import axios from "../../../utils/axios";

export const sendChatMessage = (appointmentId, message) => {
  return axios.post("/chat/send", {
    appointmentId,
    message,
  });
};

export const getChatHistory = (appointmentId) => {
  return axios.get(`/chat/history/${appointmentId}`);
};

export const getFollowUpConsultations = () => {
  return axios.get("/chat/follow-ups");
};
