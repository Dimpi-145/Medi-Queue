import axios from "../../../utils/axios";

// ================= SEND TEXT MESSAGE =================

export const sendChatMessage = async (
  appointmentId,
  message
) => {
  return axios.post(
    "/chat/send",
    {
      appointmentId,
      message,
    }
  );
};

// ================= SEND FILE MESSAGE =================

export const sendChatMessageWithFile =
  async (formData) => {
    return axios.post(
      "/chat/send-with-file",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );
  };

// ================= CHAT HISTORY =================

export const getChatHistory =
  async (appointmentId) => {
    return axios.get(
      `/chat/history/${appointmentId}`
    );
  };

// ================= FOLLOW-UP CONSULTATIONS =================

export const getFollowUpConsultations =
  async () => {
    return axios.get(
      "/chat/follow-ups"
    );
  };