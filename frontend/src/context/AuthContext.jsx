// ============================================================
// AuthContext.jsx — gestion de l'authentification globale
// Fournit l'utilisateur connecté et les fonctions login/logout
// à tous les composants enfants via le contexte React.
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI, usersAPI } from '../lib/api';

// Création du contexte (null par défaut, remplacé par AuthProvider)
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Chargement de l'utilisateur depuis le localStorage au démarrage
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vv_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // Connexion : envoie email/mot de passe, stocke le token JWT et l'utilisateur
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('vv_token', data.token);
    localStorage.setItem('vv_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  // Inscription : crée un compte et connecte directement l'utilisateur
  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('vv_token', data.token);
    localStorage.setItem('vv_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  // Déconnexion : supprime les données du localStorage et réinitialise l'état
  const logout = useCallback(() => {
    localStorage.removeItem('vv_token');
    localStorage.removeItem('vv_user');
    setUser(null);
  }, []);

  // Rafraîchissement du profil (utilisé après une modification de profil)
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await usersAPI.getProfile();
      setUser(u => ({ ...u, ...data }));
      localStorage.setItem('vv_user', JSON.stringify(data));
    } catch {}
  }, []);

  // Raccourcis de rôle utilisés dans les composants
  const isAdmin    = user?.role === 'admin';
  const isProvider = user?.role === 'prestataire' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAdmin, isProvider }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé : utilise useAuth() au lieu de useContext(AuthContext)
export const useAuth = () => useContext(AuthContext);
