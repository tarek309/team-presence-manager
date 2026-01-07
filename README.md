# Team Presence Manager

Application de gestion de présences pour équipe de football amateur.

## 🏗️ Architecture

- **Backend** : Node.js + Express + PostgreSQL
- **Frontend** : React + Vite
- **Base de données** : PostgreSQL

## 🚀 Installation rapide

### Prérequis

- Node.js (version 16 ou supérieure)
- npm (version 8 ou supérieure)
- PostgreSQL (version 13 ou supérieure)

### Configuration automatique


### Configuration manuelle

#### Backend


#### Frontend


## 🏃‍♂️ Démarrage

### Méthode 1 : Script automatique (recommandé)


### Méthode 2 : Démarrage manuel

#### Terminal 1 - Backend


Le serveur backend démarre sur http://localhost:3000

#### Terminal 2 - Frontend


Le serveur frontend démarre sur http://localhost:5173

## 📋 Scripts disponibles

### Backend (`backend/`)


### Frontend (`frontend/`)


## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` dans le dossier `backend/` :


## 🌐 URLs de développement

- **Backend API** : http://localhost:3000
- **Frontend** : http://localhost:5173

## 📁 Structure du projet


## 🧪 Tests

Les tests seront implémentés dans les prochaines itérations.


## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add: Amazing Feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Dépannage

### Le backend ne démarre pas

1. Vérifiez que le port 3000 n'est pas utilisé : `lsof -i :3000`
2. Vérifiez les logs d'erreur dans le terminal
3. Vérifiez que toutes les dépendances sont installées : `npm install`

### Le frontend ne démarre pas

1. Vérifiez que le port 5173 n'est pas utilisé : `lsof -i :5173`
2. Supprimez `node_modules` et réinstallez : `rm -rf node_modules && npm install`
3. Videz le cache Vite : `rm -rf .vite`

### Erreurs de proxy API

Le frontend utilise un proxy Vite pour rediriger les appels `/api/*` vers le backend. 
Assurez-vous que le backend fonctionne sur le port 3000.

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.
