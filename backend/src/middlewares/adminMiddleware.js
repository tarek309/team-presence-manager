const authMiddleware = require('./authMiddleware');

/**
 * Middleware pour vérifier les droits administrateur
 * Doit être utilisé après authMiddleware
 */
const adminMiddleware = [
  authMiddleware, // D'abord vérifier l'authentification
  (req, res, next) => {
    try {
      // Vérifier que l'utilisateur est présent (ajouté par authMiddleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      // Vérifier le rôle admin
      if (!req.user.isAdmin()) {
        return res.status(403).json({
          success: false,
          message: 'Droits administrateur requis'
        });
      }

      next();
    } catch (error) {
      console.error('Erreur middleware admin:', error.message);
      
      return res.status(500).json({
        success: false,
        message: 'Erreur de vérification des droits'
      });
    }
  }
];

module.exports = adminMiddleware;