import axios from "axios";

const api = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});

export async function login(username, password, role) {
  const response = await api.post("/login", {
    username,
    password,
    role
  });

  return response.data;
}

export async function register(data) {
  const response = await api.post("/register", data);

  return response.data;
}
export const getPatientDashboard = async () => {
  const response = await api.get("/patient-dashboard");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/profile", data);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/logout");
  return response.data;
};
