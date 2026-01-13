import axios from 'axios';

/**
 * Service pour gérer les appels API liés aux matchs
 */
class MatchService {
  constructor() {
    // Configuration de base d'axios
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || '/api',
      timeout: 10000,
    });

    // Intercepteur pour ajouter automatiquement le token d'authentification
    this.api.interceptors.request.use(
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

    // Intercepteur pour gérer les erreurs de réponse
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré, rediriger vers la connexion
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Récupère la liste de tous les matchs
   * @returns {Promise<Array>} Liste des matchs
   */
  async getMatches() {
    try {
      const response = await this.api.get('/matches');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des matchs:', error);
      throw new Error('Impossible de récupérer les matchs');
    }
  }

  /**
   * Récupère un match spécifique par son ID
   * @param {number} matchId - ID du match
   * @returns {Promise<Object>} Données du match
   */
  async getMatch(matchId) {
    try {
      const response = await this.api.get(`/matches/${matchId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du match ${matchId}:`, error);
      throw new Error('Impossible de récupérer le match');
    }
  }

  /**
   * Crée un nouveau match
   * @param {Object} matchData - Données du nouveau match
   * @returns {Promise<Object>} Match créé
   */
  async createMatch(matchData) {
    try {
      const response = await this.api.post('/matches', matchData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du match:', error);
      throw new Error('Impossible de créer le match');
    }
  }

  /**
   * Met à jour un match existant
   * @param {number} matchId - ID du match à modifier
   * @param {Object} matchData - Nouvelles données du match
   * @returns {Promise<Object>} Match mis à jour
   */
  async updateMatch(matchId, matchData) {
    try {
      const response = await this.api.put(`/matches/${matchId}`, matchData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du match ${matchId}:`, error);
      throw new Error('Impossible de mettre à jour le match');
    }
  }

  /**
   * Supprime un match
   * @param {number} matchId - ID du match à supprimer
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async deleteMatch(matchId) {
    try {
      await this.api.delete(`/matches/${matchId}`);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du match ${matchId}:`, error);
      throw new Error('Impossible de supprimer le match');
    }
  }

  /**
   * Met à jour la présence d'un joueur pour un match
   * @param {number} matchId - ID du match
   * @param {boolean} isPresent - Statut de présence
   * @returns {Promise<Object>} Réponse de l'API
   */
  async updatePresence(matchId, isPresent) {
    try {
      const response = await this.api.post(`/matches/${matchId}/presence`, {
        present: isPresent
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la présence pour le match ${matchId}:`, error);
      throw new Error('Impossible de mettre à jour la présence');
    }
  }

  /**
   * Récupère les présences pour un match
   * @param {number} matchId - ID du match
   * @returns {Promise<Array>} Liste des présences
   */
  async getMatchPresences(matchId) {
    try {
      const response = await this.api.get(`/matches/${matchId}/presences`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des présences pour le match ${matchId}:`, error);
      throw new Error('Impossible de récupérer les présences');
    }
  }
}

// Export d'une instance singleton
const matchService = new MatchService();
export default matchService;