import React, { useState, useEffect } from 'react';
import './MatchForm.css';

/**
 * Composant formulaire pour créer/modifier un match
 * @param {Object} props - Props du composant
 * @param {Object} props.match - Match à modifier (null pour création)
 * @param {Function} props.onSubmit - Callback de soumission
 * @param {Function} props.onCancel - Callback d'annulation
 * @param {boolean} props.isLoading - État de chargement
 */
const MatchForm = ({ match, onSubmit, onCancel, isLoading = false }) => {
  // État initial du formulaire
  const getInitialFormData = () => ({
    date_match: '',
    adversaire: '',
    lieu: '',
    type_match: 'amical',
    domicile: true,
    description: '',
    statut: 'programme'
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [errors, setErrors] = useState({});

  // Types de match disponibles
  const matchTypes = [
    { value: 'championnat', label: 'Championnat' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'amical', label: 'Amical' },
    { value: 'entrainement', label: 'Entraînement' }
  ];

  // Statuts disponibles
  const matchStatuses = [
    { value: 'programme', label: 'Programmé' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminé' },
    { value: 'annule', label: 'Annulé' },
    { value: 'reporte', label: 'Reporté' }
  ];

  // Pré-remplir le formulaire si on modifie un match
  useEffect(() => {
    if (match) {
      // Formatage de la date pour l'input datetime-local
      const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        date_match: formatDateForInput(match.date_match),
        adversaire: match.adversaire || '',
        lieu: match.lieu || '',
        type_match: match.type_match || 'amical',
        domicile: match.domicile !== undefined ? match.domicile : true,
        description: match.description || '',
        statut: match.statut || 'programme'
      });
    } else {
      setFormData(getInitialFormData());
    }
    setErrors({});
  }, [match]);

  // Gestion des changements dans les inputs
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    // Validation date
    if (!formData.date_match) {
      newErrors.date_match = 'La date et l\'heure sont obligatoires';
    } else {
      const matchDate = new Date(formData.date_match);
      const now = new Date();
      if (matchDate <= now) {
        newErrors.date_match = 'La date du match doit être dans le futur';
      }
    }

    // Validation adversaire
    if (!formData.adversaire.trim()) {
      newErrors.adversaire = 'Le nom de l\'adversaire est obligatoire';
    } else if (formData.adversaire.trim().length < 2) {
      newErrors.adversaire = 'Le nom de l\'adversaire doit faire au moins 2 caractères';
    }

    // Validation lieu
    if (!formData.lieu.trim()) {
      newErrors.lieu = 'Le lieu est obligatoire';
    } else if (formData.lieu.trim().length < 2) {
      newErrors.lieu = 'Le lieu doit faire au moins 2 caractères';
    }

    // Validation type de match
    if (!matchTypes.some(type => type.value === formData.type_match)) {
      newErrors.type_match = 'Type de match invalide';
    }

    // Validation statut
    if (!matchStatuses.some(status => status.value === formData.statut)) {
      newErrors.statut = 'Statut invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Préparation des données à envoyer
    const submitData = {
      ...formData,
      adversaire: formData.adversaire.trim(),
      lieu: formData.lieu.trim(),
      description: formData.description.trim() || null,
      date_match: new Date(formData.date_match).toISOString()
    };

    onSubmit(submitData);
  };

  return (
    <div className="match-form-overlay">
      <div className="match-form-modal">
        <div className="match-form-header">
          <h2 className="match-form-title">
            {match ? 'Modifier le match' : 'Nouveau match'}
          </h2>
          <button 
            className="match-form-close"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <form className="match-form" onSubmit={handleSubmit}>
          <div className="form-row">
            {/* Date et heure */}
            <div className="form-group">
              <label htmlFor="date_match" className="form-label">
                Date et heure *
              </label>
              <input
                type="datetime-local"
                id="date_match"
                name="date_match"
                value={formData.date_match}
                onChange={handleInputChange}
                className={`form-input ${errors.date_match ? 'form-input--error' : ''}`}
                disabled={isLoading}
                required
              />
              {errors.date_match && (
                <span className="form-error">{errors.date_match}</span>
              )}
            </div>

            {/* Adversaire */}
            <div className="form-group">
              <label htmlFor="adversaire" className="form-label">
                Adversaire *
              </label>
              <input
                type="text"
                id="adversaire"
                name="adversaire"
                value={formData.adversaire}
                onChange={handleInputChange}
                className={`form-input ${errors.adversaire ? 'form-input--error' : ''}`}
                placeholder="Nom de l'équipe adverse"
                disabled={isLoading}
                maxLength={200}
                required
              />
              {errors.adversaire && (
                <span className="form-error">{errors.adversaire}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            {/* Lieu */}
            <div className="form-group">
              <label htmlFor="lieu" className="form-label">
                Lieu *
              </label>
              <input
                type="text"
                id="lieu"
                name="lieu"
                value={formData.lieu}
                onChange={handleInputChange}
                className={`form-input ${errors.lieu ? 'form-input--error' : ''}`}
                placeholder="Stade, terrain..."
                disabled={isLoading}
                maxLength={200}
                required
              />
              {errors.lieu && (
                <span className="form-error">{errors.lieu}</span>
              )}
            </div>

            {/* Type de match */}
            <div className="form-group">
              <label htmlFor="type_match" className="form-label">
                Type de match *
              </label>
              <select
                id="type_match"
                name="type_match"
                value={formData.type_match}
                onChange={handleInputChange}
                className={`form-input ${errors.type_match ? 'form-input--error' : ''}`}
                disabled={isLoading}
                required
              >
                {matchTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type_match && (
                <span className="form-error">{errors.type_match}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            {/* Domicile/Extérieur */}
            <div className="form-group">
              <label className="form-label">Lieu de jeu</label>
              <div className="form-toggle">
                <label className="toggle-option">
                  <input
                    type="radio"
                    name="domicile"
                    checked={formData.domicile === true}
                    onChange={() => handleInputChange({
                      target: { name: 'domicile', type: 'checkbox', checked: true }
                    })}
                    disabled={isLoading}
                  />
                  <span>🏠 Domicile</span>
                </label>
                <label className="toggle-option">
                  <input
                    type="radio"
                    name="domicile"
                    checked={formData.domicile === false}
                    onChange={() => handleInputChange({
                      target: { name: 'domicile', type: 'checkbox', checked: false }
                    })}
                    disabled={isLoading}
                  />
                  <span>✈️ Extérieur</span>
                </label>
              </div>
            </div>

            {/* Statut */}
            <div className="form-group">
              <label htmlFor="statut" className="form-label">
                Statut *
              </label>
              <select
                id="statut"
                name="statut"
                value={formData.statut}
                onChange={handleInputChange}
                className={`form-input ${errors.statut ? 'form-input--error' : ''}`}
                disabled={isLoading}
                required
              >
                {matchStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {errors.statut && (
                <span className="form-error">{errors.statut}</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Informations complémentaires sur le match..."
              disabled={isLoading}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  {match ? 'Modification...' : 'Création...'}
                </>
              ) : (
                match ? 'Modifier' : 'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchForm;