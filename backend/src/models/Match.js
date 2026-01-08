/**
 * Modèle Match utilisant des requêtes SQL natives
 * Remplace l'ancien modèle Sequelize
 */

const { pool } = require('../migrate');

class Match {
  constructor(matchData) {
    this.id = matchData.id;
    this.adversaire = matchData.adversaire;
    this.date_match = matchData.date_match;
    this.lieu = matchData.lieu;
    this.type_match = matchData.type_match || 'championnat';
    this.domicile = matchData.domicile !== undefined ? matchData.domicile : true;
    this.description = matchData.description;
    this.statut = matchData.statut || 'programme';
    this.score_equipe = matchData.score_equipe || 0;
    this.score_adversaire = matchData.score_adversaire || 0;
    this.created_at = matchData.created_at;
    this.updated_at = matchData.updated_at;
  }

  /**
   * Trouve tous les matchs
   */
  static async findAll(options = {}) {
    try {
      let query = 'SELECT * FROM matches';
      const params = [];
      
      // Ajouter une condition WHERE si spécifiée
      if (options.where) {
        const conditions = [];
        let paramIndex = 1;
        
        Object.keys(options.where).forEach(key => {
          if (key === 'date_match' && typeof options.where[key] === 'object') {
            // Gestion des conditions de date (gte, lte, etc.)
            Object.keys(options.where[key]).forEach(operator => {
              switch (operator) {
                case 'gte':
                  conditions.push(`date_match >= $${paramIndex}`);
                  params.push(options.where[key][operator]);
                  paramIndex++;
                  break;
                case 'lte':
                  conditions.push(`date_match <= $${paramIndex}`);
                  params.push(options.where[key][operator]);
                  paramIndex++;
                  break;
                case 'gt':
                  conditions.push(`date_match > $${paramIndex}`);
                  params.push(options.where[key][operator]);
                  paramIndex++;
                  break;
                case 'lt':
                  conditions.push(`date_match < $${paramIndex}`);
                  params.push(options.where[key][operator]);
                  paramIndex++;
                  break;
              }
            });
          } else {
            conditions.push(`${key} = $${paramIndex}`);
            params.push(options.where[key]);
            paramIndex++;
          }
        });
        
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      // Ajouter un ORDER BY si spécifié
      if (options.order) {
        if (Array.isArray(options.order)) {
          // Format Sequelize: [['date_match', 'ASC']]
          const orderClauses = options.order.map(orderItem => {
            if (Array.isArray(orderItem)) {
              return `${orderItem[0]} ${orderItem[1] || 'ASC'}`;
            }
            return orderItem;
          });
          query += ` ORDER BY ${orderClauses.join(', ')}`;
        } else {
          query += ` ORDER BY ${options.order}`;
        }
      } else {
        query += ' ORDER BY date_match ASC';
      }
      
      // Ajouter LIMIT si spécifié
      if (options.limit) {
        query += ` LIMIT ${options.limit}`;
      }
      
      const result = await pool.query(query, params);
      return result.rows.map(row => new Match(row));
    } catch (error) {
      console.error('Erreur lors de la recherche des matchs:', error);
      throw error;
    }
  }

  /**
   * Trouve un match par son ID
   */
  static async findByPk(id) {
    try {
      const result = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);
      if (result.rows.length === 0) return null;
      return new Match(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la recherche du match par ID:', error);
      throw error;
    }
  }

  /**
   * Trouve un match selon des critères
   */
  static async findOne(options = {}) {
    try {
      let query = 'SELECT * FROM matches';
      const params = [];
      
      if (options.where) {
        const conditions = [];
        let paramIndex = 1;
        
        Object.keys(options.where).forEach(key => {
          conditions.push(`${key} = $${paramIndex}`);
          params.push(options.where[key]);
          paramIndex++;
        });
        
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      query += ' LIMIT 1';
      
      const result = await pool.query(query, params);
      if (result.rows.length === 0) return null;
      return new Match(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la recherche du match:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau match
   */
  static async create(matchData) {
    try {
      const query = `
        INSERT INTO matches (adversaire, date_match, lieu, type_match, domicile, description, statut, score_equipe, score_adversaire)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const params = [
        matchData.adversaire,
        matchData.date_match,
        matchData.lieu,
        matchData.type_match || 'championnat',
        matchData.domicile !== undefined ? matchData.domicile : true,
        matchData.description,
        matchData.statut || 'programme',
        matchData.score_equipe || 0,
        matchData.score_adversaire || 0
      ];
      
      const result = await pool.query(query, params);
      return new Match(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la création du match:', error);
      throw error;
    }
  }

  /**
   * Met à jour le match courant
   */
  async update(updateData) {
    try {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      
      // Construire la requête UPDATE dynamiquement
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      
      const query = `
        UPDATE matches 
        SET ${setClause}
        WHERE id = $${fields.length + 1}
        RETURNING *
      `;
      
      const params = [...values, this.id];
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error('Match non trouvé pour la mise à jour');
      }
      
      // Mettre à jour l'instance courante avec les nouvelles données
      const updatedMatch = result.rows[0];
      Object.keys(updatedMatch).forEach(key => {
        this[key] = updatedMatch[key];
      });
      
      return this;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du