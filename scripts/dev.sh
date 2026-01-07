#!/bin/bash

# Script pour démarrer le backend et le frontend en mode développement
# Utilise tmux pour gérer les deux processus

echo "🚀 Démarrage de l'environnement de développement"
echo "==============================================="

# Vérification que tmux est installé
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux n'est pas installé. Installation requise pour ce script."
    echo "   Sur Ubuntu/Debian: sudo apt-get install tmux"
    echo "   Sur macOS: brew install tmux"
    echo ""
    echo "Alternative: Ouvrez deux terminaux et exécutez :"
    echo "   Terminal 1: cd backend && npm run dev"
    echo "   Terminal 2: cd frontend && npm run dev"
    exit 1
fi

# Création de la session tmux
SESSION_NAME="team-presence-dev"

# Arrêter la session si elle existe déjà
tmux kill-session -t $SESSION_NAME 2>/dev/null

# Créer une nouvelle session
tmux new-session -d -s $SESSION_NAME

# Fenêtre 1: Backend
tmux rename-window -t $SESSION_NAME:0 'Backend'
tmux send-keys -t $SESSION_NAME:0 'cd backend && npm run dev' C-m

# Fenêtre 2: Frontend
tmux new-window -t $SESSION_NAME -n 'Frontend'
tmux send-keys -t $SESSION_NAME:1 'cd frontend && npm run dev' C-m

# Fenêtre 3: Terminal libre
tmux new-window -t $SESSION_NAME -n 'Terminal'

echo "✅ Environnement de développement démarré dans tmux"
echo ""
echo "📋 Commandes utiles :"
echo "   tmux attach -t $SESSION_NAME    # Se connecter à la session"
echo "   tmux kill-session -t $SESSION_NAME  # Arrêter tous les serveurs"
echo ""
echo "🌐 URLs de développement :"
echo "   Backend  : http://localhost:3000"
echo "   Frontend : http://localhost:5173"
echo ""
echo "🔧 Navigation tmux :"
echo "   Ctrl+b puis c     # Nouvelle fenêtre"
echo "   Ctrl+b puis n     # Fenêtre suivante"
echo "   Ctrl+b puis p     # Fenêtre précédente"
echo "   Ctrl+b puis d     # Détacher de la session"

# Se connecter automatiquement à la session
tmux attach -t $SESSION_NAME