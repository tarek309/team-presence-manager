import axios from 'axios';

// Configuration de base d'axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

axios.defaults.baseURL = API_BASE_URL;

// Intercepteur pour ajouter le token aux requêtes
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Service d'authentification
export const authService = {
  /**
   * Connexion d'un utilisateur
   * @param {Object} data - Données de connexion
   * @param {string} data.email - Email de l'utilisateur
   * @param {string} data.mot_de_passe - Mot de passe
   * @returns {Promise} Réponse de l'API
   */
  login: async (data) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email: data.email,
        mot_de_passe: data.password
      });
      
      if (response.data.success && response.data.data.token) {
        // Stockage du token et des données utilisateur
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Erreur de connexion' };
    }
  },

  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} data - Données d'inscription
   * @param {string} data.email - Email
   * @param {string} data.password - Mot de passe
   * @param {string} data.name - Nom complet
   * @param {string} data.role - Rôle (coach/player)
   * @returns {Promise} Réponse de l'API
   */
  register: async (data) => {
    try {
      const response = await axios.post('/api/auth/register', data);
      
      if (response.data.success && response.data.data.token) {
        // Stockage du token et des données utilisateur
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Erreur d\'inscription' };
    }
  },

  /**
   * Déconnexion de l'utilisateur
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Vérification si l'utilisateur est connecté
   * @returns {boolean} True si connecté
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Récupération de l'utilisateur connecté
   * @returns {Object|null} Données utilisateur ou null
   */
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};