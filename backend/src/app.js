// backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import des routes
const authRoutes = require('./routes/auth');
const matchesRoutes = require('./routes/matches');

const app = express();

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Middleware de logging
app.use(morgan('combined'));

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes de santé
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchesRoutes);

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  console.log(`Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route non trouvée',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/matches',
      'POST /api/matches',
      'GET /api/matches/:id',
      'PUT /api/matches/:id',
      'DELETE /api/matches/:id'
    ]
  });
});

// Middleware de gestion d'erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);
  
  // Erreur de validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: error.message
    });
  }
  
  // Erreur de base de données
  if (error.code === '23505') { // Contrainte unique PostgreSQL
    return res.status(409).json({
      error: 'Conflit de données',
      details: 'Cette ressource existe déjà'
    });
  }
  
  // Erreur générale
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

module.exports = app;