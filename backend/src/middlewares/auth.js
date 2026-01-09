// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../server');

/**
 * Middleware d'authentification par token JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token d\'accès requis',
        code: 'MISSING_TOKEN'
      });
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours en base
    const query = 'SELECT id, email, name, role FROM users WHERE id = $1';
    const result = await pool.query(query, [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = result.rows[0];
    req.user = user;
    
    next();
    
  } catch (error) {
    console.error('❌ Erreur d\'authent')}
  }