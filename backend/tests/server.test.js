const request = require('supertest');
const { app, startServer, gracefulShutdown } = require('../src/server');

describe('Server', () => {
  let server;
  
  beforeAll(async () => {
    // Démarrer le serveur pour les tests
    server = await startServer();
  });
  
  afterAll(async () => {
    // Arrêter le serveur après les tests
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });
  
  describe('Health Check', () => {
    it('devrait répondre au health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
    });
  });
  
  describe('Route par défaut', () => {
    it('devrait répondre à la route racine', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('API Team Presence Manager');
    });
  });
  
  describe('Gestion des erreurs 404', () => {
    it('devrait retourner 404 pour une route inexistante', async () => {
      const response = await request(app)
        .get('/route-inexistante')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Route non trouvée');
      expect(response.body).toHaveProperty('method', 'GET');
      expect(response.body).toHaveProperty('url', '/route-inexistante');
    });
  });
  
  describe('Gestion des signaux', () => {
    it('devrait définir les gestionnaires de signaux', () => {
      // Vérifier que les gestionnaires sont définis
      const listeners = process.listeners('SIGTERM');
      expect(listeners.length).toBeGreaterThan(0);
    });
  });
  
  describe('Graceful Shutdown', () => {
    it('devrait gérer l\'arrêt gracieux', (done) => {
      // Mock du processus exit pour éviter d'arrêter les tests
      const originalExit = process.exit;
      process.exit = jest.fn();
      
      // Mock de console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Tester l'arrêt gracieux
      gracefulShutdown('SIGTERM');
      
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Signal SIGTERM reçu')
        );
        
        // Restaurer les fonctions
        process.exit = originalExit;
        consoleSpy.mockRestore();
        
        done();
      }, 100);
    });
  });
});