// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Importăm paginile pe care tocmai le-am creat
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import BackendStatus from './components/BackendStatus';

function App() {
  // Deocamdată, App.js doar definește rutele
  return (
    <>
      <BackendStatus />
      <Routes>
        {/* Când utilizatorul este la "/", arată pagina Dashboard */}
        <Route 
    path="/" 
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } 
  />
        
        {/* Când este la "/login", arată pagina Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Când este la "/register", arată pagina Register */}
        <Route path="/register" element={<Register />} />
        
        {/* Panou de administrare protejat */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

export default App;