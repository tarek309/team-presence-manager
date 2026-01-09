// backend/src/server.js
require('dotenv').config();
const app = require('./app');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
let server;

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test de la connexion à la base de données
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connexion à la base de données réussie');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    return false;
  }
}

// Fonction de vérification si le port est disponible
function checkPortAvailability(port) {
  return new Promise((resolve) => {
    const testServer = require('net').createServer();
    
    testServer.listen(port, () => {
      testServer.close(() => resolve(true));
    });
    
    testServer.on('error', () => resolve(false));
  });
}

// Fonction pour trouver un port disponible
async function findAvailablePort(startPort) {
  let port = startPort;
  const maxPort = startPort + 10;
  
  while (port <= maxPort) {
    if (await checkPortAvailability(port)) {
      return port;
    }
    port++;
  }
  
  throw new Error(`Aucun port disponible entre ${startPort} et ${maxPort}`);
}

// Démarrage du serveur
async function startServer() {
  try {
    // Vérifier la connexion à la base de données
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.log('⚠️  Démarrage du serveur sans connexion à la base de données');
    }
    
    // Trouver un port disponible
    const availablePort = await findAvailablePort(PORT);
    
    if (availablePort !== PORT) {
      console.log(`⚠️  Le port ${PORT} est occupé, utilisation du port ${availablePort}`);
    }
    
    // Démarrer le serveur
    server = app.listen(availablePort, () => {
      console.log(`🚀 Serveur démarré sur le port ${availablePort}`);
      console.log(`📍 URL: http://localhost:${availablePort}`);
      console.log(`🏥 Health check: http://localhost:${availablePort}/health`);
      console.log(`📊 API Routes disponibles:`);
      console.log(`   - POST http://localhost:${availablePort}/api/auth/login`);
      console.log(`   - POST http://localhost:${availablePort}/api/auth/register`);
      console.log(`   - GET  http://localhost:${availablePort}/api/matches`);
      console.log(`   - POST http://localhost:${availablePort}/api/matches`);
      console.log(`   - GET  http://localhost:${availablePort}/api/matches/:id`);
      console.log(`   - PUT  http://localhost:${availablePort}/api/matches/:id`);
      console.log(`   - DELETE http://localhost:${availablePort}/api/matches/:id`);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${availablePort} est déjà utilisé`);
        console.log('💡 Solutions possibles:');
        console.log('   1. Arrêter le processus utilisant le port');
        console.log('   2. Utiliser un autre port avec PORT=XXXX npm run dev');
        console.log('   3. Redémarrer le serveur (il trouvera automatiquement un port libre)');
      } else {
        console.error('❌ Erreur serveur:', error.message);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
    process.exit(1);
  }
}

// Gestion de l'arrêt propre du serveur
function gracefulShutdown(signal) {
  console.log(`\n📶 Signal ${signal} reçu, arrêt du serveur...`);
  
  if (server) {
    server.close((error) => {
      if (error) {
        console.error('❌ Erreur lors de la fermeture du serveur:', error.message);
        process.exit(1);
      }
      
      console.log('✅ Serveur fermé proprement');
      
      // Fermer le pool de connexions
      pool.end(() => {
        console.log('✅ Connexions à la base de données fermées');
        process.exit(0);
      });
    });
    
    // Forcer l'arrêt si le serveur ne se ferme pas dans les 10 secondes
    setTimeout(() => {
      console.error('❌ Arrêt forcé du serveur (timeout)');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Écouter les signaux d'arrêt
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  gracefulShutdown('unhandledRejection');
});

// Exporter le pool pour les autres modules
module.exports = { pool };

// Démarrer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
}