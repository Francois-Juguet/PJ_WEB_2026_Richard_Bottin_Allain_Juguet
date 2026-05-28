import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost/VoyageVista/backend/api';

const api = axios.create({ baseURL: BASE, withCredentials: false });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vv_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  if (window.location.hostname.includes('ngrok')) cfg.headers['ngrok-skip-browser-warning'] = 'true';
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      const onAuthPage = window.location.hash.includes('/login') || window.location.hash.includes('/register');
      if (!onAuthPage) {
        localStorage.removeItem('vv_token');
        localStorage.removeItem('vv_user');
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: d => api.post('/auth/login.php', d),
  register: d => api.post('/auth/register.php', d),
};

export const destinationsAPI = {
  getAll: p => api.get('/destinations/index.php', { params: p }),
  getOne: id => api.get('/destinations/detail.php', { params: { id } }),
  create: d => api.post('/destinations/index.php', d),
  update: (id, d) => api.put('/destinations/detail.php', d, { params: { id } }),
  delete: id => api.delete('/destinations/detail.php', { params: { id } }),
};

export const transportsAPI = {
  search: p => api.get('/transports/index.php', { params: p }),
  create: d => api.post('/transports/index.php', d),
};

export const accommodationsAPI = {
  getAll: p => api.get('/accommodations/index.php', { params: p }),
  getAvailability: (id, p) => api.get('/accommodations/availability.php', { params: { id, ...p } }),
  create: d => api.post('/accommodations/index.php', d),
  update: (id, d) => api.put('/accommodations/detail.php', d, { params: { id } }),
  delete: id => api.delete('/accommodations/detail.php', { params: { id } }),
};

export const activitiesAPI = {
  getAll: p => api.get('/activities/index.php', { params: p }),
  create: d => api.post('/activities/index.php', d),
  update: (id, d) => api.put('/activities/detail.php', d, { params: { id } }),
  delete: id => api.delete('/activities/detail.php', { params: { id } }),
};

export const providerAPI = {
  getListings: () => api.get('/provider/listings.php'),
};

export const itinerariesAPI = {
  getAll: () => api.get('/itineraries/index.php'),
  create: d => api.post('/itineraries/index.php', d),
  getOne: id => api.get('/itineraries/detail.php', { params: { id } }),
  update: (id, d) => api.put('/itineraries/detail.php', d, { params: { id } }),
  delete: id => api.delete('/itineraries/detail.php', { params: { id } }),
};

export const bookingsAPI = {
  getAll: () => api.get('/bookings/index.php'),
  create: d => api.post('/bookings/index.php', d),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications/index.php'),
  markRead: id => api.put('/notifications/index.php', { action: 'mark_read', id }),
  markAllRead: () => api.put('/notifications/index.php', { action: 'mark_all_read' }),
  delete: id => api.delete('/notifications/index.php', { data: { id } }),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile.php'),
  updateProfile: d => api.put('/users/profile.php', d),
  getFavorites: () => api.get('/users/favorites.php'),
  toggleFavorite: d => api.post('/users/favorites.php', d),
};

export default api;
