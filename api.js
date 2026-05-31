// ============================================================
// api.js — couche de communication avec le backend PHP
// Toutes les requêtes HTTP passent par ce fichier.
// ============================================================

import axios from 'axios';

// URL de base du backend (configurable via variable d'environnement)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost/VoyageVista/backend/api';

// Instance Axios partagée par toutes les fonctions d'appel API
const api = axios.create({ baseURL: BASE, withCredentials: false });

// ── Intercepteur de requête ──────────────────────────────────
// Ajoute automatiquement le token JWT dans chaque requête sortante.
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vv_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  // En-tête spécial requis pour passer la page d'avertissement de ngrok
  if (window.location.hostname.includes('ngrok')) cfg.headers['ngrok-skip-browser-warning'] = 'true';
  return cfg;
});

// ── Intercepteur de réponse ──────────────────────────────────
// Si le serveur répond 401 (non authentifié), on déconnecte l'utilisateur
// et on le redirige vers la page de connexion.
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      const surPageAuth = window.location.hash.includes('/login') || window.location.hash.includes('/register');
      if (!surPageAuth) {
        localStorage.removeItem('vv_token');
        localStorage.removeItem('vv_user');
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Authentification ─────────────────────────────────────────
export const authAPI = {
  login:    d => api.post('/auth/login.php', d),    // connexion
  register: d => api.post('/auth/register.php', d), // inscription
};

// ── Destinations ─────────────────────────────────────────────
export const destinationsAPI = {
  getAll: p  => api.get('/destinations/index.php', { params: p }),       // liste avec filtres
  getOne: id => api.get('/destinations/detail.php', { params: { id } }), // détail d'une destination
  create: d  => api.post('/destinations/index.php', d),
  update: (id, d) => api.put('/destinations/detail.php', d, { params: { id } }),
  delete: id => api.delete('/destinations/detail.php', { params: { id } }),
};

// ── Transports ───────────────────────────────────────────────
export const transportsAPI = {
  search: p => api.get('/transports/index.php', { params: p }), // recherche vols/trains/bus
  create: d => api.post('/transports/index.php', d),
};

// ── Hébergements ─────────────────────────────────────────────
export const accommodationsAPI = {
  getAll:          p       => api.get('/accommodations/index.php', { params: p }),
  getAvailability: (id, p) => api.get('/accommodations/availability.php', { params: { id, ...p } }),
  create: d       => api.post('/accommodations/index.php', d),
  update: (id, d) => api.put('/accommodations/detail.php', d, { params: { id } }),
  delete: id      => api.delete('/accommodations/detail.php', { params: { id } }),
};

// ── Activités ────────────────────────────────────────────────
export const activitiesAPI = {
  getAll: p       => api.get('/activities/index.php', { params: p }),
  create: d       => api.post('/activities/index.php', d),
  update: (id, d) => api.put('/activities/detail.php', d, { params: { id } }),
  delete: id      => api.delete('/activities/detail.php', { params: { id } }),
};

// ── Espace prestataire ───────────────────────────────────────
export const providerAPI = {
  getListings: () => api.get('/provider/listings.php'), // liste des offres du prestataire connecté
};

// ── Itinéraires ──────────────────────────────────────────────
// Un itinéraire regroupe transports, hébergements et activités d'un voyage.
export const itinerariesAPI = {
  getAll: ()      => api.get('/itineraries/index.php'),
  create: d       => api.post('/itineraries/index.php', d),
  getOne: id      => api.get('/itineraries/detail.php', { params: { id } }),
  update: (id, d) => api.put('/itineraries/detail.php', d, { params: { id } }),  // utilisé pour ajouter/retirer des éléments
  delete: id      => api.delete('/itineraries/detail.php', { params: { id } }),
};

// ── Réservations ─────────────────────────────────────────────
export const bookingsAPI = {
  getAll: () => api.get('/bookings/index.php'),
  create: d  => api.post('/bookings/index.php', d),
};

// ── Notifications ────────────────────────────────────────────
export const notificationsAPI = {
  getAll:      ()  => api.get('/notifications/index.php'),
  markRead:    id  => api.put('/notifications/index.php', { action: 'mark_read', id }),
  markAllRead: ()  => api.put('/notifications/index.php', { action: 'mark_all_read' }),
  delete:      id  => api.delete('/notifications/index.php', { data: { id } }),
};

// ── Utilisateurs ─────────────────────────────────────────────
export const usersAPI = {
  getProfile:      ()  => api.get('/users/profile.php'),
  updateProfile:   d   => api.put('/users/profile.php', d),
  getFavorites:    ()  => api.get('/users/favorites.php'),
  toggleFavorite:  d   => api.post('/users/favorites.php', d), // ajoute ou retire un favori
};

export default api;
