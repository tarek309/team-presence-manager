const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
//const adminRoutes = require('./routes/admin');
//const playerRoutes = require('./routes/player');
//const matchRoutes = require('./routes/match');
const { getAvailablePort } = require('./utils/portUtils');

const app = express();

// Variables globales pour la gestion du serveur
let server = null;
let isShuttingDown = false;

// Configuration CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
//app.use('/api/admin', adminRoutes);
//app.use('/api/player', playerRoutes);
//app.use('/api/matches', matchRoutes);

// Route de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Route par défaut
app.get('/', (req, res) => {
  res.json({ message: 'API Team Presence Manager - Serveur en fonctionnement' });
});

// Middleware de gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    method: req.method,
    url: req.originalUrl
  });
});

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

/**
 * Démarre le serveur sur un port disponible
 */
async function startServer() {
  try {
    const preferredPort = parseInt(process.env.PORT) || 3000;
    const host = process.env.HOST || 'localhost';
    
    // Trouver un port disponible
    const port = await getAvailablePort(preferredPort, host);
    
    // Démarrer le serveur
    server = app.listen(port, host, () => {
      console.log('\n🚀 Serveur démarré avec succès !');
      console.log(`📡 Serveur d'écoute sur: http://${host}:${port}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Démarré à: ${new Date().toLocaleString('fr-FR')}`);
      
      if (port !== preferredPort) {
        console.log(`ℹ️  Note: Port ${preferredPort} occupé, utilisation du port ${port}`);
      }
      
      console.log('\n📋 Routes disponibles:');
      console.log(`   GET  http://${host}:${port}/health - Health check`);
      console.log(`   POST http://${host}:${port}/api/auth/* - Authentification`);
      console.log(`   *    http://${host}:${port}/api/* - API endpoints`);
      console.log('\n✋ Utilisez Ctrl+C pour arrêter le serveur\n');
    });
    
    // Gestion des erreurs du serveur
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Erreur: Port ${port} déjà utilisé`);
        console.log('🔄 Redémarrage avec recherche automatique d\'un nouveau port...');
        setTimeout(() => startServer(), 1000);
      } else {
        console.error('❌ Erreur serveur:', error);
        process.exit(1);
      }
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

/**
 * Arrêt gracieux du serveur
 * @param {string} signal - Le signal reçu
 */
function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log('⏳ Arrêt déjà en cours...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`\n🛑 Signal ${signal} reçu, arrêt du serveur...`);
  
  if (server) {
    server.close((err) => {
      if (err) {
        console.error('❌ Erreur lors de l\'arrêt du serveur:', err);
        process.exit(1);
      }
      
      console.log('✅ Serveur arrêté proprement');
      console.log(`⏰ Arrêté à: ${new Date().toLocaleString('fr-FR')}`);
      process.exit(0);
    });
    
    // Force l'arrêt après 10 secondes
    setTimeout(() => {
      console.log('⚠️  Arrêt forcé du serveur (timeout)');
      process.exit(1);
    }, 10000);
    
  } else {
    console.log('✅ Aucun serveur à arrêter');
    process.exit(0);
  }
}

// Gestion des signaux de fermeture
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  console.error('   Promise:', promise);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Démarrage du serveur uniquement si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
}

// Exports pour les tests
module.exports = { 
  app, 
  startServer, 
  gracefulShutdown,
  getServer: () => server
};