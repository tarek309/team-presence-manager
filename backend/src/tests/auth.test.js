const request = require('supertest');
const app = require('../app');
const pool = require('../config/database');
const User = require('../models/User');

// Configuration de test
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  role: 'player'
};

const TEST_ADMIN = {
  email: 'admin@example.com',
  password: 'adminpass123',
  name: 'Test Admin',
  role: 'admin'
};

describe('Authentication API', () => {
  
  beforeAll(async () => {
    // Nettoyer la base de test avant les tests
    await pool.query('DELETE FROM users WHERE email LIKE \'%@example.com\'');
  });

  afterAll(async () => {
    // Nettoyer après les tests
    await pool.query('DELETE FROM users WHERE email LIKE \'%@example.com\'');
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    
    test('Devrait créer un nouvel utilisateur avec des données valides', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_USER.email);
      expect(response.body.data.user.name).toBe(TEST_USER.name);
      expect(response.body.data.user.role).toBe(TEST_USER.role);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    test('Devrait rejeter un email déjà utilisé', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('déjà utilisé');
    });

    test('Devrait rejeter des données invalides', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123', // trop court
        name: '', // vide
        role: 'invalid' // rôle invalide
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('Devrait créer un utilisateur admin', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_ADMIN)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
    });

    test('Devrait utiliser le rôle "player" par défaut', async () => {
      const userWithoutRole = {
        email: 'player@example.com',
        password: 'password123',
        name: 'Default Player'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userWithoutRole)
        .expect(201);

      expect(response.body.data.user.role).toBe('player');
    });
  });

  describe('POST /api/auth/login', () => {
    
    test('Devrait connecter un utilisateur avec des credentials valides', async () => {
      const loginData = {
        email: TEST_USER.email,
        password: TEST_USER.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_USER.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    test('Devrait rejeter un mauvais mot de passe', async () => {
      const loginData = {
        email: TEST_USER.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('incorrect');
    });

    test('Devrait rejeter un email inexistant', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: '