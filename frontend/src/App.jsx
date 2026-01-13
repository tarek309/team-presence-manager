import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import Matches from './components/matches/Match.jsx'
import './App.css'

/**
 * Composant principal de l'application
 * Gère le routing et la navigation générale
 */
function App() {
  const location = useLocation()
  
  return (
    <div className="App">
      {/* Barre de navigation principale */}
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            Team Manager
          </Link>
          
          <div className="nav-links">
            <Link 
              to="/login" 
              className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
            >
              Connexion
            </Link>
            <Link 
              to="/register" 
              className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
            >
              Inscription
            </Link>
            <Link 
              to="/matches" 
              className={`nav-link ${location.pathname === '/matches' ? 'active' : ''}`}
            >
              Matchs
            </Link>
          </div>
        </div>
      </nav>

      {/* Configuration des routes */}
      <main className="main-content">
        <Routes>
          {/* Page d'accueil */}
          <Route 
            path="/" 
            element={
              <div className="home-page">
                <h1>Bienvenue sur Team Manager</h1>
                <p>Gérez facilement les présences de votre équipe de football</p>
                <div className="home-actions">
                  <Link to="/login" className="btn btn-primary">
                    Se connecter
                  </Link>
                  <Link to="/register" className="btn btn-secondary">
                    S'inscrire
                  </Link>
                </div>
              </div>
            } 
          />
          
          {/* Page de connexion */}
          <Route path="/login" element={<Login />} />
          
          {/* Page d'inscription */}
          <Route path="/register" element={<Register />} />
          
          {/* Page des matchs */}
          <Route path="/matches" element={<Matches />} />
          
          {/* Routes admin (pour éviter les erreurs futures) */}
          <Route path="/admin/matches/match" element={<Matches />} />
          
          {/* Route 404 - Page non trouvée */}
          <Route 
            path="*" 
            element={
              <div className="not-found">
                <h2>Page non trouvée</h2>
                <p>La page que vous cherchez n'existe pas.</p>
                <Link to="/" className="btn btn-primary">
                  Retour à l'accueil
                </Link>
              </div>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default App