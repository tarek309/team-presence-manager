const net = require('net');

/**
 * Vérifie si un port est disponible en tentant de créer un serveur temporaire
 * @param {number} port - Le port à vérifier
 * @param {string} host - L'hôte à utiliser (défaut: 'localhost')
 * @returns {Promise<boolean>} - true si le port est libre, false sinon
 */
function checkPortAvailability(port, host = 'localhost') {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, host, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Trouve le premier port libre à partir d'un port donné
 * @param {number} startPort - Le port de départ
 * @param {string} host - L'hôte à utiliser (défaut: 'localhost')
 * @param {number} maxAttempts - Nombre maximum de tentatives (défaut: 100)
 * @returns {Promise<number>} - Le premier port libre trouvé
 */
async function findFreePort(startPort, host = 'localhost', maxAttempts = 100) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const isAvailable = await checkPortAvailability(port, host);
    if (isAvailable) {
      return port;
    }
  }
  
  throw new Error(`Aucun port libre trouvé dans la plage ${startPort}-${startPort + maxAttempts - 1}`);
}

/**
 * Tente de libérer un port en fermant les connexions existantes
 * @param {number} port - Le port à libérer
 * @param {string} host - L'hôte à utiliser
 * @returns {Promise<boolean>} - true si le port a été libéré, false sinon
 */
async function attemptToFreePort(port, host = 'localhost') {
  try {
    // On ne peut pas forcer la fermeture d'un port depuis Node.js
    // Cette fonction est plutôt pour les extensions futures
    console.log(`⚠️  Impossible de libérer automatiquement le port ${port}`);
    console.log(`   Vérifiez manuellement avec: netstat -ano | findstr :${port}`);
    return false;
  } catch (error) {
    console.error(`Erreur lors de la tentative de libération du port ${port}:`, error.message);
    return false;
  }
}

/**
 * Fonction principale pour obtenir un port disponible
 * @param {number} preferredPort - Le port préféré
 * @param {string} host - L'hôte à utiliser
 * @returns {Promise<number>} - Le port à utiliser
 */
async function getAvailablePort(preferredPort, host = 'localhost') {
  console.log(`🔍 Vérification de la disponibilité du port ${preferredPort}...`);
  
  const isPortFree = await checkPortAvailability(preferredPort, host);
  
  if (isPortFree) {
    console.log(`✅ Port ${preferredPort} disponible`);
    return preferredPort;
  }
  
  console.log(`⚠️  Port ${preferredPort} occupé, recherche d'un port libre...`);
  
  try {
    const freePort = await findFreePort(preferredPort + 1, host);
    console.log(`✅ Port ${freePort} trouvé et disponible`);
    return freePort;
  } catch (error) {
    console.error('❌ Erreur lors de la recherche d\'un port libre:', error.message);
    throw error;
  }
}

module.exports = {
  checkPortAvailability,
  findFreePort,
  attemptToFreePort,
  getAvailablePort
};