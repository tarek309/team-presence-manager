import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * Composant de connexion
 * Permet aux utilisateurs de se connecter avec email/mot de passe
 */
const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
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
    
    // Effacer l'erreur API
    if (apiError) {
      setApiError('');
    }
  };

  /**
   * Soumission du formulaire de connexion
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const response = await authService.login(formData);
      
      if (response.success) {
        // Redirection vers la page des matchs après connexion réussie
        navigate('/matches', { replace: true });
      } else {
        setApiError(response.message || 'Erreur de connexion');
      }
    } catch (error) {
      setApiError(error.message || 'Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Connexion</h1>
          <p>Connectez-vous pour accéder à la gestion d'équipe</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
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
              placeholder="Votre mot de passe"
              autoComplete="current-password"
              disabled={isLoading}
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          {/* Boutons */}
          <div className="form-actions">
            <button
              type="submit"
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>

            <Link
              to="/register"
              className="btn btn-secondary"
            >
              S'inscrire
            </Link>
          </div>
        </form>

        <div className="login-footer">
          <p>Première visite ? <Link to="/register">Créez votre compte</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;