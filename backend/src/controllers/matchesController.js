// backend/src/controllers/matchesController.js
const { pool } = require('../config/database');

/**
 * Récupérer tous les matches
 */
const getAllMatches = async (req, res) => {
  try {
    console.log('📊 Récupération de tous les matches');
    
    const { page = 1, limit = 10, statut, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        id, adversaire, date_match, lieu, type_match, domicile, description, statut, score_equipe, score_adversaire, created_at, updated_at
      FROM matches
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    // Filtres
    if (statut) {
      query += ` AND statut = $${paramIndex}`;
      queryParams.push(statut);
      paramIndex++;
    }
    
    if (date_from) {
      query += ` AND date_match >= $${paramIndex}`;
      queryParams.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      query += ` AND date_match <= $${paramIndex}`;
      queryParams.push(date_to);
      paramIndex++;
    }
    
    // Tri et pagination
    query += ` ORDER BY date_match DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    
    // Comptage total pour la pagination
    const countQuery = `SELECT COUNT(*) FROM matches WHERE 1=1` +
      (statut ? ` AND statut = '${statut}'` : '') +
      (date_from ? ` AND date_match >= '${date_from}'` : '') +
      (date_to ? ` AND date_match <= '${date_to}'` : '');
    
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      matches: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des matches:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des matches',
      details: error.message
    });
  }
};

/**
 * Récupérer un match par son ID
 */
const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Récupération du match ID: ${id}`);
    
    const query = `
      SELECT 
        id, adversaire, date_match, lieu, type_match, domicile, description, statut, score_equipe, score_adversaire, created_at, updated_at
      FROM matches
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Match non trouvé',
        id 
      });
    }
    
    // Récupérer aussi les présences pour ce match
    const presencesQuery = `
      SELECT 
        u.id as user_id,
        u.nom,
        u.email,
        p.statut as presence_status,
        p.created_at as presence_updated_at
      FROM users u
      LEFT JOIN presences p ON u.id = p.user_id AND p.match_id = $1
      ORDER BY u.nom
    `;
    
    const presencesResult = await pool.query(presencesQuery, [id]);
    
    const match = {
      ...result.rows[0],
      presences: presencesResult.rows
    };
    
    res.json(match);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du match:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du match',
      details: error.message
    });
  }
};

/**
 * Créer un nouveau match
 */
const createMatch = async (req, res) => {
  try {
    const { adversaire, date_match, lieu, type_match = 'match', statut = 'upcoming' } = req.body;
    console.log('➕ Création d\'un nouveau match:', { adversaire, date_match, lieu, type_match });
    
    const query = `
      INSERT INTO matches 
       (adversaire, date_match, lieu, type_match, statut)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, adversaire, date_match, lieu, type_match, statut, created_at, updated_at
    `;
    
    const result = await pool.query(query, [adversaire, date_match, lieu, type_match, statut]);
    const newMatch = result.rows[0];
    
    console.log('✅ Match créé avec succès:', newMatch.id);
    res.status(201).json(newMatch);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du match:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'Un match à cette date et lieu existe déjà'
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la création du match',
      details: error.message
    });
  }
};

/**
 * Mettre à jour un match
 */
const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { adversaire, date_match, lieu, type_match, statut } = req.body;
    console.log(`📝 Mise à jour du match ID: ${id}`);
    
    // Vérifier que le match existe
    const existingMatch = await pool.query('SELECT id FROM matches WHERE id = $1', [id]);
    if (existingMatch.rows.length === 0) {
      return res.status(404).json({ error: 'Match non trouvé' });
    }
    
    // Construire la requête de mise à jour dynamiquement
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    if (adversaire !== undefined) {
      updateFields.push(`adversaire = $${paramIndex}`);
      values.push(adversaire);
      paramIndex++;
    }
    
    if (date_match !== undefined) {
      updateFields.push(`date_match = $${paramIndex}`);
      values.push(date_match);
      paramIndex++;
    }
    
    if (lieu !== undefined) {
      updateFields.push(`lieu = $${paramIndex}`);
      values.push(lieu);
      paramIndex++;
    }
    
    if (type_match !== undefined) {
      updateFields.push(`type_match = $${paramIndex}`);
      values.push(type_match);
      paramIndex++;
    }
    
    if (statut !== undefined) {
      updateFields.push(`statut = $${paramIndex}`);
      values.push(statut);
      paramIndex++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }
    
    updateFields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `
      UPDATE matches 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, adversaire, date_match, lieu, type_match, statut, created_at, updated_at
    `;
    
    const result = await pool.query(query, values);
    const updatedMatch = result.rows[0];
    
    console.log('✅ Match mis à jour avec succès:', id);
    res.json(updatedMatch);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du match:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du match',
      details: error.message
    });
  }
};

/**
 * Supprimer un match
 */
const deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Suppression du match ID: ${id}`);
    
    // Vérifier que le match existe
    const existingMatch = await pool.query('SELECT id FROM matches WHERE id = $1', [id]);
    if (existingMatch.rows.length === 0) {
      return res.status(404).json({ error: 'Match non trouvé' });
    }
    
    // Supprimer d'abord les présences associées
    await pool.query('DELETE FROM presences WHERE match_id = $1', [id]);
    
    // Supprimer le match
    await pool.query('DELETE FROM matches WHERE id = $1', [id]);
    
    console.log('✅ Match supprimé avec succès:', id);
    res.json({ message: 'Match supprimé avec succès' });
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du match:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du match',
      details: error.message
    });
  }
};

/**
 * Mettre à jour les présences pour un match
 */
const updatePresences = async (req, res) => {
  try {
    const { id } = req.params;
    const { presences } = req.body; // Array de { user_id, status }
    console.log(`👥 Mise à jour des présences pour le match ID: ${id}`);
    
    // Vérifier que le match existe
    const existingMatch = await pool.query('SELECT id FROM matches WHERE id = $1', [id]);
    if (existingMatch.rows.length === 0) {
      return res.status(404).json({ error: 'Match non trouvé' });
    }
    
    // Transaction pour mettre à jour toutes les présences
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const presence of presences) {
        const { user_id, statut } = presence;
        
        // Upsert de la présence
        await client.query(`
          INSERT INTO presences (user_id, match_id, statut)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, match_id)
          DO UPDATE SET status = $3, updated_at = NOW()
        `, [user_id, id, statut]);
      }
      
      await client.query('COMMIT');
      console.log('✅ Présences mises à jour avec succès');
      
      res.json({ message: 'Présences mises à jour avec succès' });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des présences:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour des présences',
      details: error.message
    });
  }
};

/**
 * Récupérer les présences d'un match
 */
const getPresences = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 Récupération des présences pour le match ID: ${id}`);
    
    const query = `
      SELECT 
        u.id as user_id,
        u.nom,
        u.email,
        u.role,
        COALESCE(p.statut, 'unknown') as status,
        p.updated_at
      FROM users u
      LEFT JOIN presences p ON u.id = p.user_id AND p.match_id = $1
      WHERE u.role IN ('player', 'coach', 'staff')
      ORDER BY u.role, u.nom
    `;
    
    const result = await pool.query(query, [id]);
    
    // Grouper par statut pour des statistiques
    const stats = {
      present: 0,
      absent: 0,
      unknown: 0,
      total: result.rows.length
    };
    
    result.rows.forEach(row => {
      stats[row.statut] = (stats[row.statut] || 0) + 1;
    });
    
    res.json({
      presences: result.rows,
      stats
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des présences:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des présences',
      details: error.message
    });
  }
};

module.exports = {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  updatePresences,
  getPresences
};