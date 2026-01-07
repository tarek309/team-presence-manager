const app = require('./app');

// Configuration du port
const PORT = process.env.PORT || 3000;

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL de santé: http://localhost:${PORT}/api/health`);
});

// Gestion gracieuse de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('📤 Signal SIGTERM reçu, arrêt gracieux du serveur...');
  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📤 Signal SIGINT reçu, arrêt gracieux du serveur...');
  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
});

// Gestion des erreurs non gérées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;