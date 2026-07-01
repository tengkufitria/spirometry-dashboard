// API Configuration
// Change these URLs when connecting to the production backend API

const host = window.location.hostname;
const localApi = localStorage.getItem('aerovix_api_url');
export const API_BASE_URL = localApi || import.meta.env.VITE_API_BASE_URL || `http://${host}:5000/api`
export const SOCKET_URL = localApi ? localApi.replace('/api', '') : import.meta.env.VITE_SOCKET_URL || `http://${host}:5000`

export const ENDPOINTS = {
  // Authentication
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  
  // Dashboard Data
  patients: `${API_BASE_URL}/patients`,
  patientHistory: (id) => `${API_BASE_URL}/patients/${id}/history`,
  examinations: `${API_BASE_URL}/examinations`,
  alerts: `${API_BASE_URL}/alerts`,

  messages: `${API_BASE_URL}/messages`,
  
  // Clinical Data
  spirometry: `${API_BASE_URL}/spirometry`,
  cough: `${API_BASE_URL}/cough`,
  examinations: `${API_BASE_URL}/examinations`,
  
  // LCD Devices
  deviceStatus: `${API_BASE_URL}/devices/status`
}
