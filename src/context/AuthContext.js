// src/context/AuthContext.js
import React, { createContext, useState, useContext } from 'react';

// 1. Creăm "Contextul" (cutia goală)
const AuthContext = createContext(null);

// 2. Creăm "Furnizorul" (Provider-ul)
export function AuthProvider({ children }) {
  
  // Starea inițială (cea pe care am modificat-o să citească din localStorage)
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Eroare la parsarea user-ului din localStorage", error);
      return null;
    }
  });

  // --- AICI ERA PROBABIL EROAREA ---
  // Acestea sunt funcțiile pe care le folosești în "value"
  
  // Funcția de Login
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Funcția de Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  // --- SFÂRȘITUL BLOCULUI IMPORTANT ---


  // 3. Trimitem "valorile" (user-ul și funcțiile) către toți copiii
  // Acum, 'user', 'login', și 'logout' sunt toate definite
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Creăm un "Hook" personalizat
export function useAuth() {
  return useContext(AuthContext);
}