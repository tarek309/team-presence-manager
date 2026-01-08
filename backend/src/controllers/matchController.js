const { Match, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Créer un nouveau match
 * @route POST /api/matches
 * @access Admin only
 */
const createMatch = async (req, res) => {
  try {
    const {
      date,
      opponent,
      location,
      isHome = true,
      status = 'scheduled',
      scoreTeam,
      scoreOpponent,
      presenceOpen = false,
      manOfMatchId
    } = req.body;

    // Vérifier si l'homme du match existe (si fourni)
    if (manOfMatchId) {
      const manOfMatch = await User.findByPk(manOfMatchId);
      if (!manOfMatch) {
        return res.status(400).json({
          error: 'L\'homme du match spécifié n\'existe pas'
        });
      }
    }

    const match = await Match.create({
      date,
      opponent,
      location,
      isHome,
      status,
      scoreTeam,
      scoreOpponent,
      presenceOpen,
      manOfMatchId
    });

    // Récupérer le match créé avec ses associations
    const createdMatch = await Match.findByPk(match.id, {
      include: [
        {
          model: User,
          as: 'manOfMatch',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      message: 'Match créé avec succès',
      match: createdMatch
    });
  } catch (error) {
    console.error('Erreur lors de la création du match:', error);
    
    // Gestion des erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer tous les matchs avec filtres optionnels
 * @route GET /api/matches
 * @access Public
 */
const getAllMatches = async (req, res) => {
  try {
    const {
      status,
      limit = 50,
      offset = 0
    } = req.query;

    // Construction des conditions de filtre
    const where = {};
    if (status) {
      where.status = status;
    }

    const matches = await Match.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'ASC']],
      include: [
        {
          model: User,
          as: 'manOfMatch',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      matches: matches.rows,
      pagination: {
        total: matches.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(matches.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer un match par son ID
 * @route GET /api/matches/:id
 * @access Public
 */
const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await Match.findByPk(id, {
      include: [
        {
          model: User,
          as: 'manOfMatch',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    if (!match) {
      return res.status(404).json({
        error: 'Match non trouvé'
      });
    }

    res.json({ match });
  } catch (error) {
    console.error('Erreur lors de la récupération du match:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
};

/**
 * Mettre à jour un match
 * @route PUT /api/matches/:id
 * @access Admin only
 */
const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({
        error: 'Match non trouvé'
      });
    }

    // Vérifier si l'homme du match existe (si fourni)
    if (updates.manOfMatchId) {
      const manOfMatch = await User.findByPk(updates.manOfMatchId);
      if (!manOfMatch) {
        return res.status(400).json({
          error: 'L\'homme du match spécifié n\'existe pas'
        });
      }
    }

    // Validation spécifique pour la date
    if (updates.date && new Date(updates.date) <= new Date()) {
      return res.status(400).json({
        error: 'La date du match doit être dans le futur'
      });
    }

    await match.update(updates);

    // Récupérer le match mis à jour avec ses associations
    const updatedMatch = await Match.findByPk(id, {
      include: [
        {
          model: User,
          as: 'manOfMatch',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      message: 'Match mis à jour avec succès',
      match: updatedMatch
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du match:', error);
    
    // Gestion des erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
};

/**
 * Supprimer un match
 * @route DELETE /api/matches/:id
 * @access Admin only
 */
const deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({
        error: 'Match non trouvé'
      });
    }

    // Empêcher la suppression d'un match terminé
    if (match.status === 'completed') {
      return res.status(400).json({
        error: 'Impossible de supprimer un match terminé'
      });
    }

    await match.destroy();

    res.json({
      message: 'Match supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du match:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
};

/**
 * Basculer l'ouverture/fermeture des présences
 * @route PATCH /api/matches/:id/toggle-presence
 * @access Admin only
 */
const togglePresence = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({
        error: 'Match non trouvé'
      });
    }

    // Ne pas permettre l'ouverture des présences pour un match passé
    if (!match.presenceOpen && new Date(match.date) <= new Date()) {
      return res.status(400).json({
        error: 'Impossible d\'ouvrir les présences pour un match passé'
      });
    }

    await match.update({
      presenceOpen: !match.presenceOpen
    });

    res.json({
      message: `Présences ${match.presenceOpen ? 'ouvertes' : 'fermées'} avec succès`,
      match: {
        id: match.id,
        presenceOpen: match.presenceOpen
      }
    });
  } catch (error) {
    console.error('Erreur lors du basculement des présences:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  createMatch,
  getAllMatches,
  getMatchById,
  updateMatch,
  deleteMatch,
  togglePresence
};