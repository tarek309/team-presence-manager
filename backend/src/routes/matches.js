const express = require('express');
const {
  createMatch,
  getAllMatches,
  getMatchById,
  updateMatch,
  deleteMatch,
  togglePresence
} = require('../controllers/matchController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  validateCreateMatch,
  validateUpdateMatch,
  validateQueryParams
} = require('../middleware/validateMatch');

const router = express.Router();

/**
 * @route POST /api/matches
 * @desc Créer un nouveau match
 * @access Admin only
 */
router.post('/',
  authenticate,
  requireAdmin,
  validateCreateMatch,
  createMatch
);

/**
 * @route GET /api/matches
 * @desc Récupérer tous les matchs avec filtres optionnels
 * @access Public
 */
router.get('/',
  validateQueryParams,
  getAllMatches
);

/**
 * @route GET /api/matches/:id
 * @desc Récupérer un match par son ID
 * @access Public
 */
router.get('/:id',
  getMatchById
);

/**
 * @route PUT /api/matches/:id
 * @desc Mettre à jour un match
 * @access Admin only
 */
router.put('/:id',
  authenticate,
  requireAdmin,
  validateUpdateMatch,
  updateMatch
);

/**
 * @route DELETE /api/matches/:id
 * @desc Supprimer un match
 * @access Admin only
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  deleteMatch
);

/**
 * @route PATCH /api/matches/:id/toggle-presence
 * @desc Basculer l'ouverture/fermeture des présences
 * @access Admin only
 */
router.patch('/:id/toggle-presence',
  authenticate,
  requireAdmin,
  togglePresence
);

module.exports = router;