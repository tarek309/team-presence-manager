// backend/src/routes/matches.js
const express = require('express');
const router = express.Router();
const matchesController = require('../controllers/matchesController');
const { authenticateToken } = require('../middleware/auth');
const { validateMatch, validateMatchUpdate } = require('../middleware/validation');

// Routes publiques (pour consultation)
router.get('/', matchesController.getAllMatches);
router.get('/:id', matchesController.getMatchById);

// Routes protégées (nécessitent une authentification)
router.use(authenticateToken);

// Création d'un nouveau match
router.post('/', validateMatch, matchesController.createMatch);

// Mise à jour d'un match
router.put('/:id', validateMatchUpdate, matchesController.updateMatch);

// Suppression d'un match
router.delete('/:id', matchesController.deleteMatch);

// Routes spécifiques aux présences
router.post('/:id/presences', matchesController.updatePresences);
router.get('/:id/presences', matchesController.getPresences);

module.exports = router;