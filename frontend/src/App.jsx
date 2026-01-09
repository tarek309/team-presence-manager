import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import axios from 'axios'

// Configuration d'Axios pour les appels API
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const [apiStatus, setApiStatus] = useState('loading')
  const [apiMessage, setApiMessage] = useState('')

  // Test de connexion à l'API au chargement
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        const response = await axios.get('/health')
        setApiStatus('success')
        setApiMessage(response.data.message)
      } catch (error) {
        setApiStatus('error')
        setApiMessage('Erreur de connexion à l\'API')
        console.error('Erreur API:', error)
      }
    }

    testApiConnection()
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚽ Team Presence Manager</h1>
        <p>Gestion de présences pour équipe de football amateur</p>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>

        {/* Statut de connexion à l'API */}
        <section className="api-status">
          <h2>État de l'API</h2>
          <div className={`status-indicator ${apiStatus}`}>
            {apiStatus === 'loading' && '⏳ Vérification...'}
            {apiStatus === 'success' && '✅ Connecté'}
            {apiStatus === 'error' && '❌ Déconnecté'}
          </div>
          <p>{apiMessage}</p>
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 Team Presence Manager</p>
      </footer>
    </div>
  )
}

// Composant page d'accueil
const HomePage = () => (
  <section>
    <h2>🏠 Accueil</h2>
    <div className="welcome-content">
      <p>Bienvenue dans l'application de gestion de présences !</p>
      <div className="features-preview">
        <h3>Fonctionnalités à venir :</h3>
        <ul>
          <li>👥 Gestion des joueurs</li>
          <li>📅 Planification des événements</li>
          <li>✅ Suivi des présences</li>
          <li>📊 Statistiques d'équipe</li>
        </ul>
      </div>
    </div>
  </section>
)

// Composant page à propos
const AboutPage = () => (
  <section>
    <h2>ℹ️ À propos</h2>
    <div className="about-content">
      <p>
        Team Presence Manager est une application web développée pour faciliter 
        la gestion des présences dans les équipes de football amateur.
      </p>
      <h3>Stack technique :</h3>
      <ul>
        <li>🚀 Frontend : React 18 + Vite</li>
        <li>⚙️ Backend : Node.js + Express</li>
        <li>🗄️ Base de données : PostgreSQL (à venir)</li>
      </ul>
    </div>
  </section>
)

export default App