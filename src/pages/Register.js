// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { parkingApi } from '../utils/apiClient';
import '../App.css'; 

function Register() {
  const [nume, setNume] = useState('');
  const [prenume, setPrenume] = useState('');
  const [email, setEmail] = useState('');
  const [parola, setParola] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parola.length < 6) {
      toast.warning('Parola trebuie să aibă minim 6 caractere.');
      return;
    }

    setIsLoading(true);

    try {
      await parkingApi.registerUser({ nume, prenume, email, parola });
      
      toast.success('Cont creat cu succes! Te redirecționăm...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error('Eroare la înregistrare:', err);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Înregistrare Cont Nou</h1>
      </header>
      <div className="container" style={{ maxWidth: '500px' }}>
        <h2>Creează Cont</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-grup">
            <label htmlFor="nume">Nume:</label>
            <input 
              type="text" 
              id="nume"
              value={nume}
              onChange={(e) => setNume(e.target.value)}
              required 
              disabled={isLoading}
            />
          </div>

          <div className="form-grup">
            <label htmlFor="prenume">Prenume:</label>
            <input 
              type="text" 
              id="prenume"
              value={prenume}
              onChange={(e) => setPrenume(e.target.value)}
              disabled={isLoading}
            />
          </div>

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
            <label htmlFor="parola">Parolă (min. 6 caractere):</label>
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
            {isLoading ? 'Se procesează...' : 'Creează Cont'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Ai deja cont? <Link to="/login">Intră în cont</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;