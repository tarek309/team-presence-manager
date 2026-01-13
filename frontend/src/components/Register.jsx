import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * Composant d'inscription
 * Permet aux nouveaux utilisateurs de créer un compte
 */
const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'player'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  /**
   * Validation côté client du formulaire
   * @returns {boolean} True si le formulaire est valide
   */
  const validateForm = () => {
    const newErrors = {};

    // Validation email
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation nom
    if (!formData.name) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial';
    }

    // Validation confirmation mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Validation rôle
    if (!formData.role) {
      newErrors.role = 'Veuillez sélectionner un rôle';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gestion des changements dans les champs du formulaire
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Vérification en temps réel de la confirmation du mot de passe
    if (name === 'confirmPassword' || name === 'password') {
      if (errors.confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
    
    // Effacer l'erreur API
    if (apiError) {
      setApiError('');
    }
  };

  /**
   * Soumission du formulaire d'inscription
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');

    try {
      // Préparation des données pour l'API
      const registerData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role
      };

      const response = await authService.register(registerData);
      
      if (response.success) {
        // Redirection vers la page des matchs après inscription réussie
        navigate('/matches', { replace: true });
      } else {
        setApiError(response.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      setApiError(error.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Inscription</h1>
          <p>Créez votre compte pour rejoindre l'équipe</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form" noValidate>
          {/* Message d'erreur API */}
          {apiError && (
            <div className="error-message api-error">
              <i className="error-icon">⚠️</i>
              {apiError}
            </div>
          )}

          {/* Champ Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="votre@email.com"
              autoComplete="email"
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>

          {/* Champ Nom */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nom complet <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Votre nom complet"
              autoComplete="name"
              disabled={isLoading}
            />
            {errors.name && (
              <span className="error-text">{errors.name}</span>
            )}
          </div>

          {/* Champ Rôle */}
          <div className="form-group">
            <label htmlFor="role" className="form-label">
              Rôle <span className="required">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`form-select ${errors.role ? 'error' : ''}`}
              disabled={isLoading}
            >
              <option value="">Sélectionnez un rôle</option>
              <option value="player">Joueur</option>
              <option value="coach">Entraîneur</option>
            </select>
            {errors.role && (
              <span className="error-text">{errors.role}</span>
            )}
          </div>

          {/* Champ Mot de passe */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mot de passe <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Minimum 8 caractères"
              autoComplete="new-password"
              disabled={isLoading}
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
            <div className="password-help">
              <small>Le mot de passe doit contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial</small>
            </div>
          </div>

          {/* Champ Confirmation mot de passe */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmer le mot de passe <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Répétez le mot de passe"
              autoComplete="new-password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Boutons */}
          <div className="form-actions">
            <button
              type="submit"
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Inscription...' : 'S\'enregistrer'}
            </button>

            <Link
              to="/login"
              className="btn btn-secondary"
            >
              Retour à la connexion
            </Link>
          </div>
        </form>

        <div className="register-footer">
          <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;