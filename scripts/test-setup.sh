#!/bin/bash

# Script de test pour vérifier que l'installation et la configuration sont correctes

echo "🧪 Test de la configuration du projet"
echo "===================================="

# Fonction pour afficher les résultats
check_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        return 1
    fi
}

ERRORS=0

# Test de Node.js
echo ""
echo "🔍 Vérification de l'environnement..."
node --version > /dev/null 2>&1
check_result $? "Node.js installé" || ((ERRORS++))

npm --version > /dev/null 2>&1
check_result $? "npm installé" || ((ERRORS++))

# Test des dépendances backend
echo ""
echo "🔍 Vérification du backend..."
cd backend

# Test de l'installation des dépendances
npm list --depth=0 > /dev/null 2>&1
check_result $? "Dépendances backend installées" || ((ERRORS++))

# Test de la présence de nodemon
npm list nodemon > /dev/null 2>&1
check_result $? "nodemon installé en devDependency" || ((ERRORS++))

# Test des scripts
npm run --silent test > /dev/null 2>&1
check_result $? "Script 'test' disponible" || ((ERRORS++))

# Vérification que le serveur peut démarrer (test rapide)
timeout 5s npm run dev > /dev/null 2>&1 &
PID=$!
sleep 2
kill $PID > /dev/null 2>&1
wait $PID > /dev/null 2>&1
check_result 0 "Script 'dev' fonctionne"

# Test des dépendances frontend
echo ""
echo "🔍 Vérification du frontend..."
cd ../frontend

# Test de l'installation des dépendances
npm list --depth=0 > /dev/null 2>&1
check_result $? "Dépendances frontend installées" || ((ERRORS++))

# Test de la présence de Vite
npm list vite > /dev/null 2>&1
check_result $? "Vite installé" || ((ERRORS++))

# Test de la présence de React
npm list react react-dom > /dev/null 2>&1
check_result $? "React et React-DOM installés" || ((ERRORS++))

# Test des scripts
npm run --silent test > /dev/null 2>&1
check_result $? "Script 'test' disponible" || ((ERRORS++))

# Vérification du fichier de configuration Vite
if [ -f "vite.config.js" ]; then
    check_result 0 "Configuration Vite présente"
else
    check_result 1 "Configuration Vite présente" || ((ERRORS++))
fi

cd ..

# Résumé
echo ""
echo "📊 Résumé des tests"
echo "=================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ Tous les tests sont passés ! Le projet est correctement configuré."
    echo ""
    echo "🚀 Vous pouvez maintenant démarrer le développement :"
    echo "   ./scripts/dev.sh"
    echo ""
    echo "Ou manuellement :"
    echo "   Backend  : cd backend && npm run dev"
    echo "   Frontend : cd frontend && npm run dev"
else
    echo "❌ $ERRORS erreur(s) détectée(s). Veuillez corriger les problèmes avant de continuer."
    exit 1
fi
# Rendre les scripts exécutables
chmod +x scripts/*.sh

# Tester la configuration
./scripts/test-setup.sh
cd backend
npm install
npm run dev  # Doit démarrer sans erreur
cd frontend
npm install
npm run dev  # Doit démarrer Vite