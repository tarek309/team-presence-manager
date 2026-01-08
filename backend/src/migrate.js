/**
 * Script de migration de base de données
 * Utilise des fichiers SQL pour créer et migrer la structure de la base
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Configuration de la base de données
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'team_presence',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

/**
 * Table pour tracker les migrations exécutées
 */
const createMigrationsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    await pool.query(query);
    console.log('✅ Table migrations créée/vérifiée');
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table migrations:', error);
    throw error;
  }
};

/**
 * Vérifie si une migration a déjà été exécutée
 */
const isMigrationExecuted = async (filename) => {
  try {
    const result = await pool.query(
      'SELECT 1 FROM migrations WHERE filename = $1',
      [filename]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de migration:', error);
    return false;
  }
};

/**
 * Marque une migration comme exécutée
 */
const markMigrationAsExecuted = async (filename) => {
  try {
    await pool.query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [filename]
    );
    console.log(`✅ Migration ${filename} marquée comme exécutée`);
  } catch (error) {
    console.error('❌ Erreur lors du marquage de migration:', error);
    throw error;
  }
};

/**
 * Exécute un fichier SQL de migration
 */
const executeSqlFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Divise le fichier SQL en requêtes individuelles
    const queries = sql
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0);

    // Exécute chaque requête dans une transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const query of queries) {
        if (query.trim()) {
          await client.query(query);
        }
      }
      
      await client.query('COMMIT');
      console.log(`✅ Fichier SQL exécuté avec succès: ${path.basename(filePath)}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution du fichier SQL ${filePath}:`, error);
    throw error;
  }
};

/**
 * Exécute toutes les migrations dans l'ordre
 */
const runMigrations = async () => {
  console.log('🚀 Démarrage des migrations...');
  
  try {
    // Créer la table de suivi des migrations
    await createMigrationsTable();
    
    // Dossier des migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Vérifier que le dossier existe
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log(`📁 Dossier migrations créé: ${migrationsDir}`);
    }
    
    // Lire tous les fichiers .sql du dossier migrations
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Trier par nom pour garantir l'ordre d'exécution
    
    if (files.length === 0) {
      console.log('ℹ️ Aucun fichier de migration trouvé');
      return;
    }
    
    console.log(`📄 ${files.length} fichier(s) de migration trouvé(s)`);
    
    // Exécuter chaque migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      
      // Vérifier si la migration a déjà été exécutée
      if (await isMigrationExecuted(file)) {
        console.log(`⏭️ Migration ${file} déjà exécutée, ignorée`);
        continue;
      }
      
      console.log(`🔄 Exécution de la migration: ${file}`);
      
      try {
        await executeSqlFile(filePath);
        await markMigrationAsExecuted(file);
        console.log(`✅ Migration ${file} terminée avec succès`);
      } catch (error) {
        console.error(`❌ Échec de la migration ${file}:`, error);
        throw error;
      }
    }
    
    console.log('🎉 Toutes les migrations ont été exécutées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur durant les migrations:', error);
    throw error;
  } finally {
    // Fermer le pool de connexions
    await pool.end();
  }
};

/**
 * Fonction utilitaire pour tester la connexion à la base
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Connexion à la base de données réussie:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
};

// Exporter les fonctions pour utilisation dans d'autres modules
module.exports = {
  runMigrations,
  testConnection,
  pool
};

// Si le script est exécuté directement
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Script de migration terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur lors de l\'exécution des migrations:', error);
      process.exit(1);
    });
}