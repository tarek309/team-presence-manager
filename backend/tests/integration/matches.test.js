const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User, Match } = require('../../src/models');
const { generateToken } = require('../../src/utils/jwt');

describe('Matches API', () => {
  let adminUser, playerUser, adminToken, playerToken;

  beforeAll(async () => {
    // Synchroniser la base de données de test
    await sequelize.sync({ force: true });

    // Créer des utilisateurs de test
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    playerUser = await User.create({
      firstName: 'Player',
      lastName: 'Test',
      email: 'player@test.com',
      password: 'password123',
      role: 'player'
    });

    // Générer les tokens
    adminToken = generateToken({ id: adminUser.id, role: adminUser.role });
    playerToken = generateToken({ id: playerUser.id, role: playerUser.role });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Nettoyer les matchs avant chaque test
    await Match.destroy({ where: {} });
  });

  describe('POST /api/matches', () => {
    const validMatchData = {
      date_match: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans 7 jours
      adversaire: 'FC Test',
      lieu: 'Stade Municipal',
      domicile: true
    };

    it('devrait créer un match avec un token admin', async () => {
      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validMatchData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Match créé avec succès');
      expect(response.body.match).toHaveProperty('id');
      expect(response.body.match.adversaire).toBe(validMatchData.adversaire);
      expect(response.body.match.lieu).toBe(validMatchData.lieu);
    });

    it('devrait retourner 401 sans token', async () => {
      const response = await request(app)
        .post('/api/matches')
        .send(validMatchData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token manquant');
    });

    it('devrait retourner 403 avec un token player', async () => {
      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${playerToken}`)
        .send(validMatchData);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Accès refusé. Droits administrateur requis');
    });

    it('devrait retourner 400 pour une date passée', async () => {
      const pastMatchData = {
        ...validMatchData,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Hier
      };

      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pastMatchData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Données invalides');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: ''})
          ])
        );
      });
    });
  })
    