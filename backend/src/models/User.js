const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.password_hash = userData.password_hash;
    this.name = userData.name;
    this.role = userData.role || 'player';
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  /**
   * Crée un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @param {string} userData.email - Email de l'utilisateur
   * @param {string} userData.password - Mot de passe en clair
   * @param {string} userData.name - Nom de l'utilisateur
   * @param {string} [userData.role='player'] - Rôle (admin ou player)
   * @returns {Promise<User>} L'utilisateur créé
   */
  static async create({ email, password, name, role = 'player' }) {
    // Validation des données
    if (!email || !password || !name) {
      throw new Error('Email, mot de passe et nom sont requis');
    }

    if (!['admin', 'player'].includes(role)) {
      throw new Error('Le rôle doit être "admin" ou "player"');
    }

    // Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Format d\'email invalide');
    }

    // Validation mot de passe (minimum 6 caractères)
    if (password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    try {
      // Vérifier si l'email existe déjà
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error('Cet email est déjà utilisé');
      }

      // Hasher le mot de passe
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Insérer en base
      const query = `
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, role, created_at, updated_at
      `;

      const values = [email.toLowerCase().trim(), password_hash, name.trim(), role];
      const result = await pool.query(query, values);

      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Contrainte unique violée
        throw new Error('Cet email est déjà utilisé');
      }
      throw error;
    }
  }

  /**
   * Trouve un utilisateur par email
   * @param {string} email - Email à rechercher
   * @returns {Promise<User|null>} L'utilisateur ou null si non trouvé
   */
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
   * Trouve un utilisateur par ID
   * @param {string} id - ID de l'utilisateur
   * @returns {Promise<User|null>} L'utilisateur ou null si non trouvé
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Erreur lors de la recherche utilisateur: ${error.message}`);
    }
  }

  /**
   * Vérifie un mot de passe
   * @param {string} password - Mot de passe en clair
   * @returns {Promise<boolean>} True si le mot de passe est correct
   */
  async checkPassword(password) {
    try {
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      throw new Error(`Erreur lors de la vérification du mot de passe: ${error.message}`);
    }
  }

  /**
   * Retourne les données publiques de l'utilisateur
   * @returns {Object} Données sans le hash du mot de passe
   */
  toPublic() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Vérifie si l'utilisateur est admin
   * @returns {boolean} True si admin
   */
  isAdmin() {
    return this.role === 'admin';
  }

  /**
   * Récupère tous les utilisateurs (pour admin)
   * @returns {Promise<User[]>} Liste des utilisateurs
   */
  static async findAll() {
    try {
      const query = 'SELECT * FROM users ORDER BY created_at DESC';
      const result = await pool.query(query);

      return result.rows.map(row => new User(row));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }
  }
}

module.exports = User;