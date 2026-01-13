import React from 'react';
import './matchCard.css';

/**
 * Composant pour afficher une carte de match
 * @param {Object} props - Les props du composant
 * @param {Object} props.match - Les données du match
 * @param {Function} props.onPresenceToggle - Fonction appelée lors du changement de présence
 * @param {Object} props.user - Utilisateur connecté
 */
const MatchCard = ({ match, onPresenceToggle, user }) => {
  /**
   * Formate la date au format français
   */
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Retourne l'emoji correspondant au type de match
   */
  const getMatchTypeEmoji = (type) => {
    switch (type?.toLowerCase()) {
      case 'championnat':
        return '🏆';
      case 'amical':
        return '🤝';
      case 'coupe':
        return '🥇';
      default:
        return '⚽';
    }
  };

  /**
   * Retourne la classe CSS selon le statut du match
   */
  const getStatusClass = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'termine':
        return 'status-finished';
      case 'en_cours':
        return 'status-ongoing';
      case 'programme':
        return 'status-scheduled';
      case 'annule':
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  };

  /**
   * Gère le clic sur le bouton présent
   */
  const handlePresentClick = () => {
    if (onPresenceToggle) {
      onPresenceToggle(match.id, true);
    }
  };

  /**
   * Gère le clic sur le bouton absent
   */
  const handleAbsentClick = () => {
    if (onPresenceToggle) {
      onPresenceToggle(match.id, false);
    }
  };

  return (
    <div className={`match-card ${getStatusClass(match.statut)}`}>
      {/* En-tête du match */}
      <div className="match-header">
        <h3 className="match-opponent">vs {match.adversaire}</h3>
        <span className={`match-status ${getStatusClass(match.statut)}`}>
          {match.statut}
        </span>
      </div>

      {/* Informations du match */}
      <div className="match-info">
        <div className="match-details">
          <p className="match-date">
            📅 {formatDate(match.date_match)}
          </p>
          {match.heure_match && (
            <p className="match-time">
              🕐 {match.heure_match}
            </p>
          )}
          <p className="match-location">
            📍 {match.lieu}
          </p>
          <p className="match-type">
            {getMatchTypeEmoji(match.type_match)} {match.type_match}
          </p>
        </div>

        {/* Description du match */}
        {match.description && (
          <p className="match-description">
            📝 {match.description}
          </p>
        )}

        {/* Score si le match est terminé */}
        {match.statut === 'termine' && (
          <div className="match-score">
            <span className="score">
              {match.score_equipe !== null ? match.score_equipe : '-'} - {match.score_adversaire !== null ? match.score_adversaire : '-'}
            </span>
          </div>
        )}
      </div>

      {/* Section présences */}
      <div className="match-presence">
        <div className="presence-counter">
          <span className="presence-count">
            {match.presenceCount || 0}/{match.totalPlayers || 0}
          </span>
          <span className="presence-label">présents</span>
        </div>

        {/* Actions de présence (seulement si le match n'est pas terminé) */}
        {match.statut !== 'termine' && match.statut !== 'annule' && (
          <div className="presence-actions">
            <button
              onClick={handlePresentClick}
              className="btn btn-success btn-sm"
              title="Marquer comme présent"
            >
              ✅ Présent
            </button>
            <button
              onClick={handleAbsentClick}
              className="btn btn-danger btn-sm"
              title="Marquer comme absent"
            >
              ❌ Absent
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;