const AuthService = require('../services/authService');

/**
 * Middleware d'authentification
 * Vérifie la présence et la validité du token JWT
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    // Vérifier le format "Bearer TOKEN"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Format du token invalide'
      });
    }

    // Vérifier et récupérer l'utilisateur
    const user = await AuthService.getUserFromToken(token);
    
    // Ajouter l'utilisateur à la requête
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Erreur middleware auth:', error.message);
    
    // Gérer les différents types d'erreurs
    let statusCode = 401;
    let message = 'Token invalide';

    if (error.message.includes('expiré')) {
      message = 'Token expiré';
    } else if (error.message.includes('Utilisateur non trouvé')) {
      message = 'Utilisateur non trouvé';
    }

    return res.status(statusCode).json({
      success: false,
      message
    });
  }
};

module.exports = authMiddleware;