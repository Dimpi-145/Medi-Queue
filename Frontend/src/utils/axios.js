import axios from "axios";

// ================= BASE URL =================

const BASE_URL =
  import.meta.env
    .VITE_API_BASE_URL ||
  "/api";

// ================= AXIOS INSTANCE =================

const API = axios.create({
  baseURL: BASE_URL,

  withCredentials: true,

  timeout: 30000,

  headers: {
    "Content-Type":
      "application/json",
  },
});

// ================= REQUEST INTERCEPTOR =================

API.interceptors.request.use(
  (config) => {
    try {
      const token =
        localStorage.getItem(
          "token"
        );

      if (token) {
        config.headers =
          config.headers ||
          {};

        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error(
        "[Axios] token attach error:",
        error
      );
    }

    return config;
  },

  (error) => {
    return Promise.reject(
      error
    );
  }
);

// ================= RESPONSE INTERCEPTOR =================

API.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error?.response?.status;

    // Unauthorized
    if (status === 401) {
      console.warn(
        "[Axios] Unauthorized request"
      );
    }

    // Forbidden
    if (status === 403) {
      console.warn(
        "[Axios] Forbidden request"
      );
    }

    // Server error
    if (status >= 500) {
      console.error(
        "[Axios] Server error:",
        error?.response
          ?.data || error
      );
    }

    return Promise.reject(
      error
    );
  }
);

export default API;