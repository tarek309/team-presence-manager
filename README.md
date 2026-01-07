# ⚽ Team Presence Manager

Application web de gestion de présences pour équipe de football amateur.

## 🚀 Stack technique

- **Frontend** : React 18 + Vite
- **Backend** : Node.js + Express
- **Base de données** : PostgreSQL (à venir)
- **Styling** : CSS vanilla

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn
- Git

## 🔧 Installation

### Installation complète (recommandée)


### Installation séparée

#### Backend

#### Frontend

## ⚡ Démarrage

### Développement (backend + frontend simultanément)


Cette commande démarre :
- Backend sur http://localhost:3000
- Frontend sur http://localhost:5173

### Démarrage séparé

#### Backend uniquement

#### Frontend uniquement

## 🌍 URLs de développement

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **Health Check** : http://localhost:3000/api/health

## 📁 Structure du projet


## 🔨 Scripts disponibles

### Scripts racine
- `npm run install:all` - Installation complète
- `npm run dev` - Démarrage développement (backend + frontend)
- `npm run build` - Build de production

### Scripts backend
- `npm run dev` - Développement avec nodemon
- `npm start` - Production
- `npm test` - Tests (à implémenter)

### Scripts frontend
- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Preview du build
- `npm test` - Tests (à implémenter)

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` dans le dossier `backend` basé sur `.env.example` :


## 🧪 Tests

### Vérification de l'installation

1. **Backend** :
   ```bash
   curl http://localhost:3000/api/health
   ```
   Réponse attendue : Status 200 avec message de santé

2. **Frontend** :
   Ouvrir http://localhost:5173 et vérifier :
   - Affichage de la page d'accueil
   - Indicateur API en vert "✅ Connecté"

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'feat: ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📝 Conventions

- **Commits** : Conventional Commits
- **Code** : Commentaires en français
- **Branches** : feature/, fix/, chore/

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 📞 Support

Pour toute question ou problème, ouvrir une issue sur GitHub.

---

**Status** : ✅ Configuration initiale terminée
**Prochaine étape** : Configuration base de données PostgreSQL
# Test 1: Installation
npm run install:all

# Test 2: Démarrage backend (port 3000)
npm run dev:backend

# Test 3: Démarrage frontend (port 5173)  
npm run dev:frontend

# Test 4: Health check API
curl http://localhost:3000/api/health