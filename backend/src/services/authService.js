const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  /**
   * Génère un token JWT pour un utilisateur
   * @param {User} user - Utilisateur
   * @returns {string} Token JWT
   */
  static generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const options = {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'team-presence-manager'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, options);
  }

  /**
   * Vérifie et décode un token JWT
   * @param {string} token - Token à vérifier
   * @returns {Object} Payload du token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Token invalide');
      }
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expiré');
      }
      throw new Error('Erreur de vérification du token');
    }
  }

  /**
   * Inscrit un nouvel utilisateur
   * @param {Object} userData - Données d'inscription
   * @returns {Promise<Object>} Utilisateur et token
   */
  static async register(userData) {
    try {
      // Créer l'utilisateur
      const user = await User.create(userData);

      // Générer le token
      const token = AuthService.generateToken(user);

      return {
        user: user.toPublic(),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Connecte un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Utilisateur et token
   */
  static async login(email, password) {
    try {
      // Validation des données
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      // Trouver l'utilisateur
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Vérifier le mot de passe
      const isValidPassword = await user.checkPassword(password);
      if (!isValidPassword) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Générer le token
      const token = AuthService.generateToken(user);

      return {
        user: user.toPublic(),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère un utilisateur depuis un token
   * @param {string} token - Token JWT
   * @returns {Promise<User>} Utilisateur
   */
  static async getUserFromToken(token) {
    try {
      const payload = AuthService.verifyToken(token);
      const user = await User.findById(payload.userId);

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthService;