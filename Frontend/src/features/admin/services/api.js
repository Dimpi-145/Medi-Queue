// services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust if needed

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Auth APIs
export const createPatient = (patientData) => api.post('/auth/admin/create-patient', patientData);
export const createDoctor = (doctorData) => api.post('/auth/admin/create-doctor', doctorData);

// Queue APIs
export const addToQueue = (queueData) => api.post('/queue/admin/add-to-queue', queueData);
export const getLiveQueue = () => api.get('/queue/live');

// Admin APIs
export const getDoctors = () => api.get('/admin/doctors');
export const getPatients = () => api.get('/admin/patients');
export const getAppointments = () => api.get('/admin/appointments');
export const bookAppointment = (appointmentData) => api.post('/admin/appointments', appointmentData);

// Dashboard stats (assuming endpoints)
export const getDashboardStats = () => api.get('/admin/stats');

export default api;