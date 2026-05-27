import axios from 'axios';

// Vite exposes client environment variables through import.meta.env.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const taskAPI = {
  createTask: (data) => api.post('/tasks', data),
  getTasks: (date) => api.get(`/tasks${date ? `?date=${date}` : ''}`),
  getTasksByDate: (date) => api.get(`/tasks/date/${date}`),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  markTaskDone: (id) => api.patch(`/tasks/${id}/done`),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const reportAPI = {
  getDailyReport: (date) => api.get(`/reports/daily/${date}`),
  getWeeklyReport: () => api.get('/reports/weekly'),
  getOverallStats: () => api.get('/reports/stats'),
};

export default api;
