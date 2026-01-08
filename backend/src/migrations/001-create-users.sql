-- Migration 001: Création de la table users
-- Remplace la migration Sequelize pour les utilisateurs

-- Création de la table users si elle n'existe pas
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'coach', 'player')),
    poste VARCHAR(50),
    numero_maillot INTEGER UNIQUE,
    telephone VARCHAR(20),
    date_naissance DATE,
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_actif ON users(actif);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application du trigger sur la table users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion d'un utilisateur admin par défaut si aucun admin n'existe
INSERT INTO users (nom, email, mot_de_passe, role)
SELECT 'Admin', 'admin@team.com', '$2b$10$YourHashedPasswordHere', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin');