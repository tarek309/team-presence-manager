import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Match.css'

/**
 * Composant de gestion des matchs
 * Affiche la liste des matchs et permet la gestion des présences
 */
function Match() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Vérifier l'authentification au chargement du composant
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      // Rediriger vers la page de connexion si non authentifié
      navigate('/login')
      return
    }
    
    loadMatches()
  }, [navigate])

  /**
   * Charge la liste des matchs depuis l'API
   */
  const loadMatches = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      
      const response = await fetch('/api/matches', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
      } else if (response.status === 401) {
        // Token expiré ou invalide
        localStorage.removeItem('authToken')
        navigate('/login')
      } else {
        setError('Erreur lors du chargement des matchs')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matchs:', error)
      setError('Erreur de connexion. Veuillez réessayer.')
      
      // Données de démonstration en cas d'erreur API
      setMatches([
        {
          id: 1,
          opponent: 'FC Rival',
          date: '2024-01-20',
          time: '15:00',
          location: 'Stade Municipal',
          type: 'Championship',
          presenceCount: 18,
          totalPlayers: 22
        },
        {
          id: 2,
          opponent: 'AS Locale',
          date: '2024-01-27',
          time: '14:30',
          location: 'Terrain Annexe',
          type: 'Friendly',
          presenceCount: 15,
          totalPlayers: 22
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  /**
   * Gère la déconnexion de l'utilisateur
   */
  const handleLogout = () => {
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  /**
   * Gère la confirmation de présence pour un match
   */
  const handlePresenceToggle = async (matchId, isPresent) => {
    try {
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`/api/matches/${matchId}/presence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPresent })
      })

      if (response.ok) {
        // Recharger les matchs pour mettre à jour les compteurs
        loadMatches()
      } else {
        setError('Erreur lors de la mise à jour de votre présence')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de présence:', error)
      setError('Erreur de connexion')
    }
  }

  if (loading) {
    return (
      <div className="match-container">
        <div className="loading">
          <p>Chargement des matchs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="match-container">
      <div className="match-header">
        <h2>Gestion des Matchs</h2>
        <button 
          onClick={handleLogout}
          className="btn btn-secondary"
        >
          Déconnexion
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="no-matches">
          <p>Aucun match programmé pour le moment.</p>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map(match => (
            <div key={match.id} className="match-card">
              <div className="match-info">
                <h3 className="match-opponent">vs {match.opponent}</h3>
                <div className="match-details">
                  <p className="match-date">
                    📅 {new Date(match.date).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="match-time">
                    🕐 {match.time}
                  </p>
                  <p className="match-location">
                    📍 {match.location}
                  </p>
                  <p className="match-type">
                    🏆 {match.type}
                  </p>
                </div>
              </div>

              <div className="match-presence">
                <div className="presence-counter">
                  <span className="presence-count">
                    {match.presenceCount || 0}/{match.totalPlayers || 0}
                  </span>
                  <span className="presence-label">présents</span>
                </div>

                <div className="presence-actions">
                  <button
                    onClick={() => handlePresenceToggle(match.id, true)}
                    className="btn btn-success btn-sm"
                  >
                    ✅ Présent
                  </button>
                  <button
                    onClick={() => handlePresenceToggle(match.id, false)}
                    className="btn btn-danger btn-sm"
                  >
                    ❌ Absent
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Match