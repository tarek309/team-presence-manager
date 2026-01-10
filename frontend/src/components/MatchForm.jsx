import React, { useState, useEffect } from 'react';

/**
 * Composant formulaire de match
 * Permet de créer ou éditer un match
 */
const MatchForm = ({ match, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    opponent: '',
    date: '',
    time: '',
    location: '',
    type: 'Amical'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);