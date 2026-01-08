const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const authMiddleware = require('../middlewares/authMiddleware');
const { body, validationResult } = require('express-validator');

// Middleware de validation pour l'inscription
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('mot_de_passe')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('nom')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('role')
    .optional()
    .isIn(['admin', 'player'])
    .withMessage('Le rôle doit être "admin" ou "player"')
];

// Middleware de validation pour la connexion
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('mot_de_passe')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, mot_de_passe, nom, role } = req.body;

    // Inscrire l'utilisateur
    const result = await AuthService.register({
      email,
      mot_de_passe,
      nom,
      role
    });

    console.log(`Nouvel utilisateur inscrit: ${email} (${role || 'player'})`);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: result
    });

  } catch (error) {
    console.error('Erreur inscription:', error.message);

    // Gérer les erreurs spécifiques
    let statusCode = 400;
    let message = error.message;

    if (error.message.includes('déjà utilisé')) {
      statusCode = 409; // Conflit
    }

    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, mot_de_passe } = req.body;

    // Connecter l'utilisateur
    const result = await AuthService.login(email, mot_de_passe);

    console.log(`Connexion réussie: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: result
    });

  } catch (error) {
    console.error('Erreur connexion:', error.message);

    // Pour la sécurité, on retourne toujours 401 pour les erreurs de login
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Récupère les informations de l'utilisateur connecté
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Informations utilisateur récupérées',
      data: {
        user: req.user.toPublic()
      }
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error.message);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

/**
 * POST /api/auth/logout
 * Déconnexion (côté client, suppression du token)
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    console.log(`Déconnexion: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur déconnexion:', error.message);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
});

module.exports = router;