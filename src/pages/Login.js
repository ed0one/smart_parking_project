// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importăm Link și useNavigate
import { useAuth } from '../context/AuthContext'; // Importăm "cârligul" de autentificare
import '../App.css'; 

function Login() {
  const [email, setEmail] = useState('');
  const [parola, setParola] = useState('');
  const [error, setError] = useState(''); // "Memorie" pentru erori

  const { login } = useAuth(); // Extragem funcția 'login' din Context
  const navigate = useNavigate(); // Unealtă pentru a naviga programatic

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(''); // Resetăm eroarea

    try {
      // 1. Apelăm API-ul de Backend
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, parola })
      });

      const data = await response.json();

      if (!response.ok) {
        // Dacă serverul dă eroare (404, 500 etc)
        throw new Error(data.error || 'A apărut o eroare');
      }

      // 2. SUCCES! Apelăm funcția 'login' din Context
      login(data); // 'data' conține { idUtilizator, nume, email }

      // 3. Navigăm utilizatorul către pagina principală (Dashboard)
      navigate('/');

    } catch (err) {
      console.error('Eroare la login:', err);
      setError(err.message); // Afișăm eroarea pe ecran
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Login - Parcare Inteligentă</h1>
      </header>
      <div className="container" style={{ maxWidth: '500px' }}>
        <h2>Autentificare</h2>
        <form onSubmit={handleSubmit} className="login-form">

          {/* Afișăm eroarea, dacă există */}
          {error && <p className="error-mesaj">{error}</p>}

          <div className="form-grup">
            <label htmlFor="email">Email:</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-grup">
            <label htmlFor="parola">Parolă:</label>
            <input 
              type="password" 
              id="parola"
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="login-button">Intră în cont</button>
        </form>

        {/* Link către pagina de înregistrare */}
        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Nu ai cont? <Link to="/register">Înregistrează-te</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;