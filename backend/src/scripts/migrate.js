// backend/scripts/migrate.js
// Script pour exécuter les migrations SQL

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigrations() {
  console.log('🗄️  Exécution des migrations...\n');
  
  try {
    // Vérifier la connexion
    await pool.query('SELECT NOW()');
    console.log('✅ Connexion à PostgreSQL établie\n');
    
    // Créer la table de suivi des migrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table migrations créée\n');
    
    // Lire tous les fichiers de migration
    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.error('❌ Dossier migrations/ introuvable');
      console.log('💡 Créez le dossier: backend/migrations/\n');
      process.exit(1);
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Tri alphabétique pour ordre d'exécution
    
    if (files.length === 0) {
      console.log('⚠️  Aucune migration trouvée dans migrations/\n');
      process.exit(0);
    }
    
    console.log(`📂 ${files.length} migration(s) trouvée(s):\n`);
    
    for (const file of files) {
      // Vérifier si déjà exécutée
      const { rows } = await pool.query(
        'SELECT * FROM migrations WHERE name = $1',
        [file]
      );
      
      if (rows.length > 0) {
        console.log(`   ⏭️  ${file} (déjà exécutée)`);
        continue;
      }
      
      // Lire et exécuter la migration
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`   🔄 Exécution de ${file}...`);
      
      await pool.query(sql);
      
      // Marquer comme exécutée
      await pool.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [file]
      );
      
      console.log(`   ✅ ${file} exécutée avec succès`);
    }
    
    console.log('\n🎉 Toutes les migrations ont été exécutées!\n');
    
    // Afficher les tables créées
    const { rows: tables } = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log('📊 Tables dans la base de données:');
    tables.forEach(t => console.log(`   - ${t.tablename}`));
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Fonction pour rollback (optionnel)
async function rollback() {
  console.log('🔄 Rollback des migrations...\n');
  
  try {
    await pool.query('SELECT NOW()');
    
    // Récupérer la dernière migration
    const { rows } = await pool.query(
      'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (rows.length === 0) {
      console.log('ℹ️  Aucune migration à rollback\n');
      return;
    }
    
    const lastMigration = rows[0].name;
    console.log(`⏮️  Rollback de: ${lastMigration}`);
    
    // Ici vous devriez avoir des fichiers de rollback
    // Pour l'instant, on supprime juste l'entrée
    await pool.query('DELETE FROM migrations WHERE name = $1', [lastMigration]);
    
    console.log('✅ Migration marquée comme non exécutée');
    console.log('⚠️  Note: Les tables ne sont pas supprimées automatiquement\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécution
const command = process.argv[2];

if (command === 'rollback') {
  rollback();
} else {
  runMigrations();
}