import axios from 'axios';
import { API_BASE } from '../utils/constants';

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30000,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qa_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('qa_token');
      localStorage.removeItem('qa_user');
      // Only redirect if not already on an auth page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login',    data),
  me:       ()      => api.get('/auth/me'),
};

// ── Room endpoints ────────────────────────────────────────────────────────────
export const roomAPI = {
  create:    (data) => api.post('/rooms',            data),
  join:      (data) => api.post('/rooms/join',       data),
  getByCode: (code) => api.get(`/rooms/${code}`),
  myRooms:   ()     => api.get('/rooms/my/hosted'),
  results:   (id)   => api.get(`/rooms/${id}/results`),
};

// ── Quiz endpoints ────────────────────────────────────────────────────────────
export const quizAPI = {
  generate: (data) => api.post('/quiz/generate', data),
};

// ── Email endpoints ───────────────────────────────────────────────────────────
export const emailAPI = {
  invite: (data) => api.post('/email/invite', data),
};

export default api;
