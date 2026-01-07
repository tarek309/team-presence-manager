// backend/src/config/database.js
// Configuration de la connexion PostgreSQL

const { Pool } = require('pg');

// Créer le pool de connexions
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Configuration optimale pour développement
  max: 20, // nombre maximum de clients dans le pool
  idleTimeoutMillis: 30000, // temps avant qu'un client inactif soit fermé
  connectionTimeoutMillis: 2000, // temps maximum pour établir une connexion
});

// Gestion des erreurs du pool
pool.on('error', (err, client) => {
  console.error('❌ Erreur inattendue sur le client PostgreSQL:', err);
  process.exit(-1);
});

// Test de connexion au démarrage
pool.on('connect', (client) => {
  console.log('✅ Nouvelle connexion PostgreSQL établie');
});

// Fonction pour tester la connexion
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données établie');
    console.log(`📅 Heure du serveur DB: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    console.error('\n💡 Vérifiez:');
    console.error('   - PostgreSQL est démarré');
    console.error('   - DATABASE_URL dans .env est correct');
    console.error('   - La base de données existe\n');
    return false;
  }
}

// Fonction helper pour exécuter des requêtes
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Requête exécutée', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erreur requête DB:', error.message);
    throw error;
  }
}

// Fonction pour obtenir un client (pour les transactions)
async function getClient() {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Wrapper pour logger automatiquement
  client.query = (...args) => {
    client.lastQuery = args;
    return query(...args);
  };
  
  // Timeout pour éviter les connexions bloquées
  const timeout = setTimeout(() => {
    console.error('⚠️  Client non releasé après 5s');
    console.error('Dernière requête:', client.lastQuery);
  }, 5000);
  
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release();
  };
  
  return client;
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};