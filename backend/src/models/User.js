/**
 * Modèle User utilisant des requêtes SQL natives
 * Remplace l'ancien modèle Sequelize
 */

const { pool } = require('../migrate');
const bcrypt = require('bcrypt');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.nom = userData.nom;
    this.email = userData.email;
    this.mot_de_passe = userData.mot_de_passe;
    this.role = userData.role || 'player';
    this.poste = userData.poste;
    this.numero_maillot = userData.numero_maillot;
    this.telephone = userData.telephone;
    this.date_naissance = userData.date_naissance;
    this.actif = userData.actif !== undefined ? userData.actif : true;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  /**
   * Trouve tous les utilisateurs
   */
  static async findAll(options = {}) {
    try {
      let query = 'SELECT * FROM users';
      const params = [];
      
      // Ajouter une condition WHERE si spécifiée
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
      
      // Ajouter un ORDER BY si spécifié
      if (options.order) {
        query += ` ORDER BY ${options.order}`;
      } else {
        query += ' ORDER BY created_at DESC';
      }
      
      const result = await pool.query(query, params);
      return result.rows.map(row => new User(row));
    } catch (error) {
      console.error('Erreur lors de la recherche des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Trouve un utilisateur par son ID
   */
  static async findByPk(id) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) return null;
      return new User(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la recherche de l\'utilisateur par ID:', error);
      throw error;
    }
  }
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email.toLowerCase().trim()]);

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Erreur lors de la recherche utilisateur: ${error.message}`);
    }
  }

  /**
   * Trouve un utilisateur selon des critères
   */
  static async findOne(options = {}) {
    try {
      let query = 'SELECT * FROM users';
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
      return new User(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la recherche de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel utilisateur
   */
  static async create(userData) {
    try {
      // Hacher le mot de passe si fourni
      if (userData.mot_de_passe) {
        userData.mot_de_passe = await bcrypt.hash(userData.mot_de_passe, 10);
      }

      const query = `
        INSERT INTO users (nom, email, mot_de_passe, role, poste, numero_maillot, telephone, date_naissance, actif)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const params = [
        userData.nom,
        userData.email,
        userData.mot_de_passe,
        userData.role || 'player',
        userData.poste,
        userData.numero_maillot,
        userData.telephone,
        userData.date_naissance,
        userData.actif !== undefined ? userData.actif : true
      ];
      
      const result = await pool.query(query, params);
      return new User(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Met à jour l'utilisateur courant
   */
  async update(updateData) {
    try {
      // Hacher le mot de passe si fourni
      if (updateData.mot_de_passe) {
        updateData.mot_de_passe = await bcrypt.hash(updateData.mot_de_passe, 10);
      }

      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      
      // Construire la requête UPDATE dynamiquement
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      
      const query = `
        UPDATE users 
        SET ${setClause}
        WHERE id = $${fields.length + 1}
        RETURNING *
      `;
      
      const params = [...values, this.id];
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error('Utilisateur non trouvé pour la mise à jour');
      }
      
      // Mettre à jour l'instance courante avec les nouvelles données
      const updatedUser = result.rows[0];
      Object.keys(updatedUser).forEach(key => {
        this[key] = updatedUser[key];
      });
      
      return this;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprime l'utilisateur courant
   */
  async destroy() {
    try {
      const result = await pool.query('DELETE FROM users WHERE id = $1', [this.id]);
      if (result.rowCount === 0) {
        throw new Error('Utilisateur non trouvé pour la suppression');
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le mot de passe correspond
   */
  async checkPassword(password) {
    try {
      return await bcrypt.compare(password, this.mot_de_passe);
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      return false;
    }
  }

  /**
   * Retourne les données de l'utilisateur sans le mot de passe
   */
  toJSON() {
    const userData = { ...this };
    delete userData.mot_de_passe;
    return userData;
  }
  toPublic() {
    return {
      id: this.id,
      email: this.email,
      nom: this.nom,
      role: this.role,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Compte le nombre total d'utilisateurs
   */
  static async count(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as count FROM users';
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
      
      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Erreur lors du comptage des utilisateurs:', error);
      throw error;
    }
  }
}

module.exports = User;