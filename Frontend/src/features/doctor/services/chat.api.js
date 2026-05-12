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

export const sendChatMessageWithFile = (formData) => {
  return axios.post("/chat/send-with-file", formData, {
    headers: {
      // Let axios set the proper multipart boundary, but explicitly
      // indicate we're sending form data so servers/middlewares behave correctly.
      "Content-Type": "multipart/form-data",
    },
  });
};
