-- Migration 003: Création de la table presences
-- Gestion des présences des joueurs aux matchs

-- Création de la table presences
CREATE TABLE IF NOT EXISTS presences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    statut VARCHAR(20) NOT NULL DEFAULT 'non_renseigne' CHECK (statut IN ('present', 'absent', 'incertain', 'non_renseigne')),
    commentaire TEXT,
    date_reponse TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte d'unicité : un utilisateur ne peut avoir qu'une seule réponse par match
    UNIQUE(user_id, match_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_presences_user_id ON presences(user_id);
CREATE INDEX IF NOT EXISTS idx_presences_match_id ON presences(match_id);
CREATE INDEX IF NOT EXISTS idx_presences_statut ON presences(statut);

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_presences_updated_at ON presences;
CREATE TRIGGER update_presences_updated_at
    BEFORE UPDATE ON presences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour automatiquement date_reponse quand le statut change
CREATE OR REPLACE FUNCTION update_date_reponse()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le statut change et n'est plus 'non_renseigne', mettre à jour date_reponse
    IF NEW.statut != OLD.statut AND NEW.statut != 'non_renseigne' THEN
        NEW.date_reponse = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_presences_date_reponse ON presences;
CREATE TRIGGER update_presences_date_reponse
    BEFORE UPDATE ON presences
    FOR EACH ROW
    EXECUTE FUNCTION update_date_reponse();