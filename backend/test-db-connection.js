// backend/test-db-connection.js
require('dotenv').config();
const { pool, testConnection } = require('./src/config/database');

async function test() {
  console.log('🔍 Test de connexion à la base de données...\n');
  
  console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}\n`);
  
  const success = await testConnection();
  
  if (success) {
    console.log('\n✅ Configuration correcte!');
    
    // Vérifier les tables
    try {
      const result = await pool.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `);
      
      console.log('\n📊 Tables existantes:');
      if (result.rows.length === 0) {
        console.log('   ⚠️  Aucune table trouvée');
        console.log('   💡 Exécutez les migrations: node scripts/migrate.js');
      } else {
        result.rows.forEach(r => console.log(`   - ${r.tablename}`));
      }
    } catch (error) {
      console.error('❌ Erreur:', error.message);
    }
  } else {
    console.log('\n❌ Impossible de se connecter à la base de données');
  }
  
  await pool.end();
}

test();