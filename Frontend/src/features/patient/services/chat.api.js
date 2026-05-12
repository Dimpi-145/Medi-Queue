import axios from "../../../utils/axios";

export const sendChatMessage = (appointmentId, message) => {
  return axios.post("/chat/send", {
    appointmentId,
    message,
  });
};

export const sendChatMessageWithFile = (formData) => {
  return axios.post("/chat/send-with-file", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getChatHistory = (consultationId) => {
  return axios.get(`/chat/history/${consultationId}`);
};

export const getFollowUpConsultations = () => {
  return axios.get("/chat/follow-ups");
};
