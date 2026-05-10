import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/auth",
  withCredentials: true,
});

export async function login(identifier, password) {
  const response = await api.post("/login", {
    username: identifier,
    email: identifier,
    password,
  });

  return response.data;
}

export async function register(data) {
  const response = await api.post("/register", data);

  return response.data;
}

export async function getMyProfile() {
  const response = await api.get("/me");

  return response.data;
}

export async function updateMyProfile(data) {
  const response = await api.put("/me", data);

  return response.data;
}

export async function logout() {
  const response = await api.post("/logout");

  return response.data;
}

export async function getDoctors() {
  const response = await api.get("/doctors");

  return response.data;
}
