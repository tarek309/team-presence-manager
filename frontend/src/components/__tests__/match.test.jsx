import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Match from '../match';
import { useAuth } from '../../contexts/AuthContext';
import matchService from '../../services/matchService';

// Mock des dépendances