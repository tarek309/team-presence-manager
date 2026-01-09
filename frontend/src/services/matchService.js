import axios from 'axios';

// Configuration de base pour les appels API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Instance axios avec configuration de base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Intercepteur pour ajouter automatiquement le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Service pour la gestion des matchs
export const matchService = {
  /**
   * Récupère tous les matchs avec pagination
   * @param {Object} params - Paramètres de pagination et filtrage
   * @returns {Promise} Liste des matchs avec métadonnées de pagination
   */
  getAll: (params = {}) => {
    return apiClient.get('/api/matches', { params });
  },

  /**
   * Crée un nouveau match
   * @param {Object} matchData - Données du match à créer
   * @returns {Promise} Match créé
   */
  create: (matchData) => {
    return apiClient.post('/api/matches', matchData);
  },

  /**
   * Met à jour un match existant
   * @param {number} id - ID du match à mettre à jour
   * @param {Object} matchData - Nouvelles données du match
   * @returns {Promise} Match mis à jour
   */
  update: (id, matchData) => {
    return apiClient.put(`/api/matches/${id}`, matchData);
  },

  /**
   * Supprime un match
   * @param {number} id - ID du match à supprimer
   * @returns {Promise} Confirmation de suppression
   */
  delete: (id) => {
    return apiClient.delete(`/api/matches/${id}`);
  },

  /**
   * Récupère un match par son ID
   * @param {number} id - ID du match
   * @returns {Promise} Détails du match
   */
  getById: (id) => {
    return apiClient.get(`/api/matches/${id}`);
  }
};

export default matchService;