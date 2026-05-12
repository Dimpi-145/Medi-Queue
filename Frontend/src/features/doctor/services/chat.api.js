import axios from "../../../utils/axios";

export const sendChatMessage = (appointmentId, message) => {
  return axios.post("/chat/send", {
    appointmentId,
    message,
  });
};

export const getChatHistory = (consultationId) => {
  return axios.get(`/chat/history/${consultationId}`);
};
