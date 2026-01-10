import React from 'react';

/**
 * Composant carte de match
 * Affiche les détails d'un match avec actions possibles
 */
const MatchCard = ({ match, onEdit, onDelete, canEdit = false }) => {
  /**
   * Formatage de la date pour affichage
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Formatage de l'heure
   */
  const formatTime = (timeString) => {
    return timeString;
  };

  /**
   * Couleur du badge selon le type de match
   */
  const getTypeBadgeClass = (type) => {
    const baseClass = 'match-type-badge';
    switch (type?.toLowerCase()) {
      case 'championnat':
        return `${baseClass} championship`;
      case 'amical':
        return `${baseClass} friendly`;
      case 'coupe':
        return `${baseClass} cup`;
      default:
        return `${baseClass} default`;
    }
  };

  return (
    <div className="match-card">
      {/* En-tête de la carte */}
      <div className="match-card-header">
        <div className="match-type">
          <span className={getTypeBadgeClass(match.type)}>
            {match.type || 'Match'}
          </span>
        </div>
        
        {canEdit && (
          <div className="match-actions">
            <button
              onClick={() => onEdit(match)}
              className="action-btn edit-btn"
              title="Modifier le match"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(match.id)}
              className="action-btn delete-btn"
              title="Supprimer le match"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="match-card-content">
        {/* Adversaire */}
        <div className="match-opponent">
          <h3 className="opponent-name">
            <span className="vs-text">vs</span>
            {match.opponent}
          </h3>
        </div>

        {/* Informations du match */}
        <div className="match-info">
          <div className="info-item">
            <span className="info-icon">📅</span>
            <div className="info-text">
              <strong>{formatDate(match.date)}</strong>
              <small>à {formatTime(match.time)}</small>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">📍</span>
            <div className="info-text">
              <strong>{match.location}</strong>
              <small>Lieu du match</small>
            </div>
          </div>
        </div>
      </div>

      {/* Pied de carte */}
      <div className="match-card-footer">
        <button className="btn btn-outline btn-sm">
          Voir les détails
        </button>
        
        <div className="match-status">
          <span className="status-indicator upcoming">À venir</span>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;