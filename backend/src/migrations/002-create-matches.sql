-- Migration 002: Création de la table matches
-- Remplace la migration Sequelize pour les matchs

-- Suppression de l'ancienne table si elle existe (pour un redémarrage propre)
-- DROP TABLE IF EXISTS matches CASCADE;

-- Création de la table matches
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    adversaire VARCHAR(200) NOT NULL,
    date_match TIMESTAMP NOT NULL,
    lieu VARCHAR(200) NOT NULL,
    type_match VARCHAR(20) NOT NULL DEFAULT 'championnat' CHECK (type_match IN ('championnat', 'coupe', 'amical', 'entrainement')),
    domicile BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'programme' CHECK (statut IN ('programme', 'en_cours', 'termine', 'annule', 'reporte')),
    score_equipe INTEGER DEFAULT 0,
    score_adversaire INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date_match);
CREATE INDEX IF NOT EXISTS idx_matches_statut ON matches(statut);
CREATE INDEX IF NOT EXISTS idx_matches_type ON matches(type_match);

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion de quelques matchs d'exemple pour les tests
INSERT INTO matches (adversaire, date_match, lieu, type_match, domicile, description)
VALUES 
    ('FC Rival', CURRENT_DATE + INTERVAL '7 days', 'Stade Municipal', 'championnat', true, 'Match de championnat important'),
    ('US Concurrent', CURRENT_DATE + INTERVAL '14 days', 'Stade Visiteur', 'championnat', false, 'Déplacement difficile'),
    ('AS Amical', CURRENT_DATE + INTERVAL '21 days', 'Terrain d''entrainement', 'amical', true, 'Match amical de préparation')
ON CONFLICT DO NOTHING;