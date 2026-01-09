import React from 'react';
import './MatchCard.css';

/**
 * Composant pour afficher une carte de match
 * @param {Object} props - Props du composant
 * @param {Object} props.match - Données du match
 * @param {Function} props.onEdit - Callback pour éditer le match
 * @param {Function} props.onDelete - Callback pour supprimer le match
 */
const MatchCard = ({ match, onEdit, onDelete }) => {
  // Formatage de la date et heure
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR'),
      time: date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // Détermine la classe CSS selon le statut
  const getStatusBadgeClass = (status) => {
    const baseClass = 'match-card__status-badge';
    switch (status) {
      case 'programme': return `${baseClass} ${baseClass}--scheduled`;
      case 'en_cours': return `${baseClass} ${baseClass}--ongoing`;
      case 'termine': return `${baseClass} ${baseClass}--finished`;
      case 'annule': return `${baseClass} ${baseClass}--cancelled`;
      case 'reporte': return `${baseClass} ${baseClass}--postponed`;
      default: return baseClass;
    }
  };

  // Traduction des statuts
  const getStatusLabel = (status) => {
    const statusMap = {
      'programme': 'Programmé',
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'annule': 'Annulé',
      'reporte': 'Reporté'
    };
    return statusMap[status] || status;
  };

  // Traduction des types de match
  const getMatchTypeLabel = (type) => {
    const typeMap = {
      'championnat': 'Championnat',
      'coupe': 'Coupe',
      'amical': 'Amical',
      'entrainement': 'Entraînement'
    };
    return typeMap[type] || type;
  };

  const { date, time } = formatDateTime(match.date_match);

  const handleDelete = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le match contre ${match.adversaire} ?`)) {
      onDelete(match.id);
    }
  };

  return (
    <div className="match-card">
      <div className="match-card__header">
        <div className="match-card__datetime">
          <span className="match-card__date">{date}</span>
          <span className="match-card__time">{time}</span>
        </div>
        <span className={getStatusBadgeClass(match.statut)}>
          {getStatusLabel(match.statut)}
        </span>
      </div>

      <div className="match-card__main">
        <h3 className="match-card__opponent">vs {match.adversaire}</h3>
        <div className="match-card__details">
          <div className="match-card__venue">
            <span className="match-card__venue-icon">📍</span>
            <span>{match.lieu}</span>
            <span className="match-card__home-away">
              {match.domicile ? '(Domicile)' : '(Extérieur)'}
            </span>
          </div>
          <div className="match-card__type">
            <span className="match-card__type-label">
              {getMatchTypeLabel(match.type_match)}
            </span>
          </div>
        </div>

        {match.description && (
          <p className="match-card__description">{match.description}</p>
        )}

        {match.statut === 'termine' && (
          <div className="match-card__score">
            <span className="match-card__score-label">Score final :</span>
            <span className="match-card__score-value">
              {match.score_equipe} - {match.score_adversaire}
            </span>
          </div>
        )}
      </div>

      <div className="match-card__actions">
        <button 
          className="btn btn--secondary btn--small"
          onClick={() => onEdit(match)}
          title="Modifier le match"
        >
          ✏️ Modifier
        </button>
        <button 
          className="btn btn--danger btn--small"
          onClick={handleDelete}
          title="Supprimer le match"
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
};

export default MatchCard;