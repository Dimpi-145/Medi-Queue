import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Attach Authorization header from localStorage token on each request
API.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;