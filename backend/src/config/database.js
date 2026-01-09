// backend/src/config/database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ Erreur pool PostgreSQL:', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('✅ Nouvelle connexion PostgreSQL établie');
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données établie');
    console.log(`📅 Heure serveur DB: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion DB:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};