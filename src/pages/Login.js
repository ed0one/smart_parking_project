// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; // Folosim toast-ul global
import { parkingApi } from '../utils/apiClient'; // Importăm API-ul centralizat
import '../App.css'; 

function Login() {
  const [email, setEmail] = useState('');
  const [parola, setParola] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsLoading(true);

    try {
      // Folosim metoda din apiClient
      const data = await parkingApi.loginUser({ email, parola });
      
      // Dacă ajungem aici, nu a fost eroare
      login(data);
      toast.success(`Bine ai venit, ${data.nume || 'utilizator'}!`);
      navigate('/');

    } catch (err) {
      console.error('Eroare la login:', err);
      // Mesajul de eroare vine deja formatat din apiClient
      toast.error(err.message || 'Date de autentificare invalide.');
    } finally {
      setIsLoading(false);
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
          <div className="form-grup">
            <label htmlFor="email">Email:</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'button-loading' : ''}`} 
            disabled={isLoading}
          >
            {isLoading ? 'Se autentifică...' : 'Intră în cont'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Nu ai cont? <Link to="/register">Înregistrează-te</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;