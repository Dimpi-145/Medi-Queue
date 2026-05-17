import axios from "axios";

const api = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});

export async function login(identifier, password, role, hospitalId = null) {
  const payload = {
    username: identifier,
    password,
    role,
  };

  if (hospitalId) {
    payload.hospitalId = hospitalId;
  }

  const response = await api.post("/login", payload);

  return response.data;
}

export async function register(data) {
  const response = await api.post("/register", data);

  return response.data;
}

export async function resetPassword(data) {
  const response = await api.post("/forgot-password", data);

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

export const getHospitals = async () => {
  const response = await api.get("/hospitals");
  return response.data;
};
