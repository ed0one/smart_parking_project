// src/components/ProtectedRoute.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// Acest component este "bodyguard-ul" nostru
function ProtectedRoute({ children }) {
  const { user } = useAuth(); // Verificăm în Context dacă avem un utilizator

  if (!user) {
    // --- BLOCAT! ---
    // Dacă nu există utilizator logat, 
    // navighează (redirecționează) forțat la pagina de login.
    return <Navigate to="/login" replace />;
  }

  // --- PERMIS! ---
  // Dacă există un utilizator, arată componenta "copil"
  // (în cazul nostru, pagina Dashboard)
  return children;
}

export default ProtectedRoute;