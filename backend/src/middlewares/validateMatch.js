const { body, query, validationResult } = require('express-validator');

/**
 * Validation pour la création d'un match
 */
const validateCreateMatch = [
  body('date_match')
    .isISO8601()
    .withMessage('La date doit être au format ISO 8601')
    .custom((value) => {
      const matchDate = new Date(value);
      const now = new Date();
      if (matchDate <= now) {
        throw new Error('La date du match doit être dans le futur');
      }
      return true;
    }),
  
  body('adversaire')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de l\'adversaire doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-'\.]+$/)
    .withMessage('Le nom de l\'adversaire contient des caractères non autorisés'),
  
  body('lieu')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Le lieu doit contenir entre 2 et 200 caractères'),
  
  
  body('score_equipe')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le score de l\'équipe doit être un entier positif'),
  
  body('score_adversaire')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le score de l\'adversaire doit être un entier positif'),
  
  body('presenceOpen')
    .optional()
    .isBoolean()
    .withMessage('presenceOpen doit être un booléen'),

  // Middleware pour gérer les erreurs de validation
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }
    next();
  }
];

/**
 * Validation pour la mise à jour d'un match
 */
const validateUpdateMatch = [
  body('date_match')
    .optional()
    .isISO8601()
    .withMessage('La date doit être au format ISO 8601'),
  
  body('adversaire')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de l\'adversaire doit contenir entre 2 et 100 caractères'),
  
  body('lieu')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Le lieu doit contenir entre 2 et 200 caractères'),
  
  
  
   body('score_equipe')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le score de l\'équipe doit être un entier positif'),
  
  body('score_adversaire')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le score de l\'adversaire doit être un entier positif'),
  
  body('presenceOpen')
    .optional()
    .isBoolean()
    .withMessage('presenceOpen doit être un booléen'),

  body('manOfMatchId')
    .optional()
    .isUUID()
    .withMessage('manOfMatchId doit être un UUID valide'),

  // Middleware pour gérer les erreurs de validation
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }
    next();
  }
];

/**
 * Validation pour les paramètres de requête
 */
const validateQueryParams = [
 
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('L\'offset doit être un entier positif'),

  // Middleware pour gérer les erreurs de validation
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Paramètres de requête invalides',
        details: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateCreateMatch,
  validateUpdateMatch,
  validateQueryParams
};