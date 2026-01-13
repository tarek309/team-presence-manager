import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MatchCard from './matchCard';
import MatchForm from './matchForm';
import matchService from '../services/matchService';
import './match.css';

const Match = () => {
  const { user, token, logout } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Charger les matchs au montage du composant
  useEffect(() => {
    fetchMatches();
  }, [refreshTrigger]);

  /**
   * Récupère la liste des matchs depuis l'API
   */
  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Utilisation du service matchService
      const data = await matchService.getMatches();
      setMatches(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des matchs:', error);
      setError('Impossible de charger les matchs');
      
      // Données de fallback avec la nouvelle structure
      setMatches([
        {
          id: 1,
          adversaire: 'FC Rival',
          date_match: '2024-01-20',
          lieu: 'Stade Municipal',
          type_match: 'championnat',
          description: 'Match de championnat important',
          statut: 'programme',
          presenceCount: 18,
          totalPlayers: 22,
          score_equipe: null,
          score_adversaire: null
        },
        {
          id: 2,
          adversaire: 'AS Locale',
          date_match: '2024-01-27',
          lieu: 'Terrain Annexe',
          type_match: 'amical',
          description: 'Match amical de préparation',
          statut: 'programme',
          presenceCount: 15,
          totalPlayers: 22,
          score_equipe: 2,
          score_adversaire: 1
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère le changement de présence d'un joueur pour un match
   */
  const handlePresenceToggle = async (matchId, isPresent) => {
    try {
      await matchService.updatePresence(matchId, isPresent);
      // Rafraîchir la liste des matchs
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la présence:', error);
      setError('Impossible de mettre à jour la présence');
    }
  };

  /**
   * Ouvre le formulaire d'ajout de match
   */
  const handleAddMatch = () => {
    setShowMatchForm(true);
  };

  /**
   * Ferme le formulaire d'ajout de match
   */
  const handleCloseMatchForm = () => {
    setShowMatchForm(false);
  };

  /**
   * Gère la soumission d'un nouveau match
   */
  const handleMatchSubmit = async (matchData) => {
    try {
      await matchService.createMatch(matchData);
      setShowMatchForm(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Erreur lors de la création du match:', error);
      setError('Impossible de créer le match');
    }
  };

  if (loading) {
    return (
      <div className="matches-container">
        <div className="loading-spinner">
          <p>Chargement des matchs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-container">
      {/* En-tête avec boutons d'action */}
      <div className="matches-header">
        <h1>Matchs de l'équipe</h1>
        <div className="header-actions">
          {/* Bouton Nouveau match visible seulement pour les admins */}
          {user?.role === 'admin' && (
            <button 
              onClick={handleAddMatch}
              className="btn btn-primary"
            >
              ➕ Nouveau match
            </button>
          )}
          <button onClick={logout} className="btn btn-secondary">
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={fetchMatches} className="btn btn-link">
            🔄 Réessayer
          </button>
        </div>
      )}

      {/* Liste des matchs */}
      {matches.length === 0 ? (
        <div className="no-matches">
          <p>Aucun match programmé pour le moment.</p>
          {user?.role === 'admin' && (
            <button onClick={handleAddMatch} className="btn btn-primary">
              Créer le premier match
            </button>
          )}
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onPresenceToggle={handlePresenceToggle}
              user={user}
            />
          ))}
        </div>
      )}

      {/* Modal pour ajouter un match */}
      {showMatchForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nouveau match</h2>
              <button 
                onClick={handleCloseMatchForm}
                className="btn-close"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <MatchForm 
              onSubmit={handleMatchSubmit}
              onCancel={handleCloseMatchForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Match;