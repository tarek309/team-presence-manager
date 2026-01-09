const { 
  checkPortAvailability, 
  findFreePort, 
  getAvailablePort,
  attemptToFreePort 
} = require('../../src/utils/portUtils');
const net = require('net');

describe('Port Utils', () => {
  let testServers = [];
  
  // Fonction helper pour créer un serveur de test
  const createTestServer = (port, host = 'localhost') => {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      
      server.listen(port, host, () => {
        testServers.push(server);
        resolve(server);
      });
      
      server.on('error', reject);
    });
  };
  
  // Nettoyage après chaque test
  afterEach(async () => {
    const closePromises = testServers.map(server => {
      return new Promise((resolve) => {
        if (server.listening) {
          server.close(resolve);
        } else {
          resolve();
        }
      });
    });
    
    await Promise.all(closePromises);
    testServers = [];
  });
  
  describe('checkPortAvailability', () => {
    it('devrait retourner true pour un port libre', async () => {
      const isAvailable = await checkPortAvailability(0); // Port 0 = auto-assigné
      expect(isAvailable).toBe(true);
    });
    
    it('devrait retourner false pour un port occupé', async () => {
      // Créer un serveur sur un port spécifique
      const server = await createTestServer(0);
      const port = server.address().port;
      
      const isAvailable = await checkPortAvailability(port);
      expect(isAvailable).toBe(false);
    });
    
    it('devrait gérer les erreurs de connexion', async () => {
      // Tenter de se connecter à un port invalide
      const isAvailable = await checkPortAvailability(-1);
      expect(isAvailable).toBe(false);
    });
    
    it('devrait fonctionner avec différents hôtes', async () => {
      const isAvailable = await checkPortAvailability(0, '127.0.0.1');
      expect(isAvailable).toBe(true);
    });
  });
  
  describe('findFreePort', () => {
    it('devrait trouver un port libre à partir du port donné', async () => {
      const freePort = await findFreePort(3000);
      expect(freePort).toBeGreaterThanOrEqual(3000);
      expect(typeof freePort).toBe('number');
    });
    
    it('devrait trouver le port suivant si le premier est occupé', async () => {
      // Occuper le port 3001
      const server = await createTestServer(3000);
      
      const freePort = await findFreePort(3000, 'localhost', 10);
      expect(freePort).toBeGreaterThan(3000);
    });
    
    it('devrait lever une erreur si aucun port libre n\'est trouvé dans la plage', async () => {
      // Créer des serveurs sur une petite plage
      const startPort = 3100;
      const maxAttempts = 3;
      
      for (let i = 0; i < maxAttempts + 1; i++) {
        await createTestServer(startPort + i);
      }
      
      await expect(findFreePort(startPort, 'localhost', maxAttempts))
        .rejects.toThrow(/Aucun port libre trouvé/);
    });
    
    it('devrait respecter le nombre maximum de tentatives', async () => {
      const startTime = Date.now();
      
      try {
        await findFreePort(65535, 'localhost', 5); // Ports très élevés
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Le test ne devrait pas prendre trop de temps avec seulement 5 tentatives
        expect(duration).toBeLessThan(2000); // Moins de 2 secondes
        expect(error.message).toContain('Aucun port libre trouvé');
      }
    });
  });
  
  describe('getAvailablePort', () => {
    it('devrait retourner le port préféré s\'il est libre', async () => {
      const preferredPort = 3050;
      const availablePort = await getAvailablePort(preferredPort);
      
      expect(availablePort).toBe(preferredPort);
    });
    
    it('devrait retourner un port alternatif si le préféré est occupé', async () => {
      const preferredPort = 3051;
      
      // Occuper le port préféré
      await createTestServer(preferredPort);
      
      const availablePort = await getAvailablePort(preferredPort);
      
      expect(availablePort).toBeGreaterThan(preferredPort);
      expect(typeof availablePort).toBe('number');
    });
    
    it('devrait gérer les erreurs de recherche de port', async () => {
      // Tester avec un port invalide qui causera une erreur
      const mockFindFreePort = jest.fn().mockRejectedValue(new Error('Test error'));
      const originalFindFreePort = require('../../src/utils/portUtils').findFreePort;
      
      // Mock temporaire
      const portUtils = require('../../src/utils/portUtils');
      portUtils.findFreePort = mockFindFreePort;
      
      await expect(getAvailablePort(65535))
        .rejects.toThrow('Test error');
      
      // Restaurer la fonction originale
      portUtils.findFreePort = originalFindFreePort;
    });
  });
  
  describe('attemptToFreePort', () => {
    it('devrait retourner false car la libération automatique n\'est pas possible', async () => {
      const result = await attemptToFreePort(3000);
      expect(result).toBe(false);
    });
    
    it('devrait logger un message d\'information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await attemptToFreePort(3000);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Impossible de libérer automatiquement le port')
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Intégration - Scénarios réels', () => {
    it('devrait gérer un scénario complet de recherche de port', async () => {
      const startPort = 3200;
      
      // Occuper quelques ports
      await createTestServer(startPort);
      await createTestServer(startPort + 1);
      
      // La fonction devrait trouver le port 3202
      const availablePort = await getAvailablePort(startPort);
      expect(availablePort).toBeGreaterThanOrEqual(startPort + 2);
      
      // Vérifier que le port trouvé est vraiment libre
      const isActuallyFree = await checkPortAvailability(availablePort);
      expect(isActuallyFree).toBe(true);
    });
    
    it('devrait fonctionner avec différents hôtes', async () => {
      const port1 = await getAvailablePort(3300, 'localhost');
      const port2 = await getAvailablePort(3300, '127.0.0.1');
      
      expect(typeof port1).toBe('number');
      expect(typeof port2).toBe('number');
      expect(port1).toBeGreaterThanOrEqual(3300);
      expect(port2).toBeGreaterThanOrEqual(3300);
    });
  });
});