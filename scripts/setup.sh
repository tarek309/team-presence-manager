#!/bin/bash

# Script de configuration initial du projet Team Presence Manager
# Ce script installe les dépendances pour le backend et le frontend

echo "🚀 Configuration du projet Team Presence Manager"
echo "================================================"

# Vérification de Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js version 16 ou supérieure."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Version de Node.js trop ancienne. Veuillez installer Node.js version 16 ou supérieure."
    exit 1
fi

echo "✅ Node.js version $(node -v) détecté"

# Installation des dépendances backend
echo ""
echo "📦 Installation des dépendances backend..."
cd backend
if npm install; then
    echo "✅ Dépendances backend installées avec succès"
else
    echo "❌ Erreur lors de l'installation des dépendances backend"
    exit 1
fi

# Installation des dépendances frontend
echo ""
echo "📦 Installation des dépendances frontend..."
cd ../frontend
if npm install; then
    echo "✅ Dépendances frontend installées avec succès"
else
    echo "❌ Erreur lors de l'installation des dépendances frontend"
    exit 1
fi

cd ..

echo ""
echo "🎉 Configuration terminée avec succès !"
echo ""
echo "📋 Commandes disponibles :"
echo "   Backend  : cd backend && npm run dev"
echo "   Frontend : cd frontend && npm run dev"
echo ""
echo "🌐 URLs de développement :"
echo "   Backend  : http://localhost:3000"
echo "   Frontend : http://localhost:5173"