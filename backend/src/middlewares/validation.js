// backend/src/middleware/validation.js
const { body, param, validationResult } = require('express-validator');

/**
 * Middleware pour gérer les erreurs de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Erreurs de validation',
      details: errors.array()
    });
  }
  
  next();
};

/**
 * Validation pour la création d'un match
 */
const validateMatch = [
  body('adversaire')
    .notEmpty()
    .withMessage('L\'adversaire est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('L\'adversaire doit contenir entre 2 et 100 caractères'),
    
  body('date_match')
    .notEmpty()
    .withMessage('La date est requise')
    .isISO8601()
    .withMessage('La date doit être au format ISO 8601')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset time to compare only dates
      
      if (date < now) {
        throw new Error('La date ne peut pas être dans le passé');
      }
      return true;
    }),
    
  body('lieu')
    .notEmpty()
    .withMessage('Le lieu est requis')
    .isLength({ min: 2, max: 200 })
    .withMessage('Le lieu doit contenir entre 2 et 200 caractères'),
    
  body('type_match')
    .optional()
    .isIn(['championnat', 'coupe', 'entrainement', 'amical'])
    .withMessage('Le type doit être: championnat, coupe, entrainement, amical'),
    
    
  handleValidationErrors
];

/**
 * Validation pour la mise à jour d'un match
 */
const validateMatchUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du match doit être un entier positif'),
    
  body('adversaire')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('L\'adversaire doit contenir entre 2 et 100 caractères'),
    
  body('date_match')
    .optional()
    .isISO8601()
    .withMessage('La date doit être au format ISO 8601'),
    
  body('lieu')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Le lieu doit contenir entre 2 et 200 caractères'),
   body('type_match')
    .optional()
    .isIn(['championnat', 'coupe', 'entrainement', 'amical'])
    .withMessage('Le type doit être: championnat, coupe, entrainement, amical'),
    
  body('statut')
    .optional()
    .isIn(['programme', 'en_cours', 'termine', 'annule','reporte'])
    .withMessage('Le statut doit être: programme, en_cours, termine, annule,reporte'),
    
  handleValidationErrors
];

/**
 * Validation pour les présences
 */
const validatePresences = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du match doit être un entier positif'),
    
  body('presences')
    .isArray({ min: 1 })
    .withMessage('Les présences doivent être un tableau non vide'),
    
  body('presences.*.user_id')
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  body('presences.*.status')
    .isIn(['present', 'absent', 'unknown'])
    .withMessage('Le statut de présence doit être: present, absent ou unknown'),
    
  handleValidationErrors
];

module.exports = {
  validateMatch,
  validateMatchUpdate,
  validatePresences,
  handleValidationErrors
};