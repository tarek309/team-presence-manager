import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import MatchCard from './MatchCard';
import MatchForm from './MatchForm';

/**
 * Composant principal de gestion des matchs
 * Accessible uniquement aux utilisateurs authentifiés
 */
const Matches = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Vérification de l'authentification au chargement
   */
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    // Simulation de chargement des matchs (à remplacer par un appel API)
    setTimeout(() => {
      setMatches([
        {
          id: 1,
          opponent: 'FC Barcelona',
          date: '2024-01-15',
          time: '15:00',
          location: 'Stade Municipal',
          type: 'Amical'
        },
        {
          id: 2,
          opponent: 'Real Madrid',
          date: '2024-01-22',
          time: '16:30',
          location: 'Stade de la Ville',
          type: 'Championnat'
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, [navigate]);

  /**
   * Déconnexion de l'utilisateur
   */
  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  /**
   * Ouverture du formulaire pour créer un nouveau match
   */
  const handleCreateMatch = () => {
    setEditingMatch(null);
    setShowForm(true);
  };

  /**
   * Ouverture du formulaire pour éditer un match
   */
  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setShowForm(true);
  };

  /**
   * Fermeture du formulaire
   */
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMatch(null);
  };

  /**
   * Sauvegarde d'un match (création ou édition)
   */
  const handleSaveMatch = (matchData) => {
    if (editingMatch) {
      // Édition
      setMatches(prev => prev.map(match => 
        match.id === editingMatch.id ? { ...matchData, id: editingMatch.id } : match
      ));
    } else {
      // Création
      const newMatch = {
        ...matchData,
        id: Date.now() // ID temporaire
      };
      setMatches(prev => [...prev, newMatch]);
    }
    
    handleCloseForm();
  };

  /**
   * Suppression d'un match
   */
  const handleDeleteMatch = (matchId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) {
      setMatches(prev => prev.filter(match => match.id !== matchId));
    }
  };

  if (isLoading) {
    return (
      <div className="matches-loading">
        <div className="loading-spinner">⚽</div>
        <p>Chargement des matchs...</p>
      </div>
    );
  }

  return (
    <div className="matches-container">
      {/* En-tête */}
      <header className="matches-header">
        <div className="header-content">
          <h1>Gestion des Matchs</h1>
          <div className="header-actions">
            <div className="user-info">
              <span className="user-welcome">
                Bonjour, <strong>{user?.nom || user?.name}</strong>
              </span>
              <span className="user-role">({user?.role})</span>
            </div>
            <button 
              onClick={handleLogout}
              className="btn btn-outline"
              title="Se déconnecter"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="matches-main">
        {/* Barre d'actions */}
        <div className="matches-actions">
          <button
            onClick={handleCreateMatch}
            className="btn btn-primary"
            disabled={user?.role !== 'admin' && user?.role !== 'coach'}
          >
            <span className="btn-icon">+</span>
            Nouveau Match
          </button>
          
          <div className="matches-stats">
            <span className="stat-item">
              <strong>{matches.length}</strong> match{matches.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Liste des matchs */}
        <div className="matches-grid">
          {matches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⚽</div>
              <h3>Aucun match programmé</h3>
              <p>Commencez par créer votre premier match</p>
              {(user?.role === 'admin' || user?.role === 'coach') && (
                <button
                  onClick={handleCreateMatch}
                  className="btn btn-primary"
                >
                  Créer un match
                </button>
              )}
            </div>
          ) : (
            matches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                onEdit={handleEditMatch}
                onDelete={handleDeleteMatch}
                canEdit={user?.role === 'admin' || user?.role === 'coach'}
              />
            ))
          )}
        </div>
      </main>

      {/* Formulaire modal */}
      {showForm && (
        <MatchForm
          match={editingMatch}
          onSave={handleSaveMatch}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Matches;