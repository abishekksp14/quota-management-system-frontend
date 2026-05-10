import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// User APIs
export const submitRequest = (data) => api.post('/requests', data);
export const getMyRequests = () => api.get('/requests/me');
export const getMyQuota = () => api.get('/quota/me');
export const updateMyRequest = (requestId, data) => api.put(`/requests/${requestId}`, data);
export const deleteMyRequest = (requestId) => api.delete(`/requests/${requestId}`);

// Admin APIs
export const getAllUsers = () => api.get('/admin/users');
export const updateUserQuota = (userId, quotaLimit) => 
  api.put(`/admin/quota/${userId}`, { quotaLimit });
export const getAllRequests = () => api.get('/admin/requests');
export const updateRequestStatus = (requestId, status) => 
  api.put(`/admin/requests/${requestId}`, { status });
export const getReports = () => api.get('/admin/reports');

export default api;
