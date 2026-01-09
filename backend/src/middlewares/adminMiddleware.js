// backend/src/middleware/adminMiddleware.js
// Middleware pour vérifier que l'utilisateur est admin

module.exports = (req, res, next) => {
  // req.user est défini par authMiddleware
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Non authentifié. Utilisez authMiddleware avant adminMiddleware.' 
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Accès refusé. Droits administrateur requis.' 
    });
  }
  
  next();
};