// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importăm Link și useNavigate
import '../App.css'; 

function Register() {
  // Avem nevoie de state pentru fiecare câmp din formular
  const [nume, setNume] = useState('');
  const [prenume, setPrenume] = useState('');
  const [email, setEmail] = useState('');
  const [parola, setParola] = useState('');

  const [error, setError] = useState(''); // Pentru erori (ex: email duplicat)
  const [success, setSuccess] = useState(''); // Pentru mesajul de succes

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validare simplă (parola ar trebui să fie mai complexă într-o app reală)
    if (parola.length < 6) {
      setError('Parola trebuie să aibă minim 6 caractere.');
      return;
    }

    try {
      // 1. Apelăm API-ul de Backend
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nume, prenume, email, parola })
      });

      const data = await response.json();

      if (!response.ok) {
        // Aruncăm eroarea primită de la server (ex: "Email deja folosit")
        throw new Error(data.error || 'A apărut o eroare');
      }

      // 2. SUCCES!
      setSuccess('Cont creat cu succes! Vei fi redirecționat către pagina de login...');

      // 3. Trimitem utilizatorul la pagina de Login după 3 secunde
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('Eroare la înregistrare:', err);
      setError(err.message); // Afișăm eroarea (ex: "Acest email este deja folosit.")
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Înregistrare Cont Nou</h1>
      </header>
      <div className="container" style={{ maxWidth: '500px' }}>
        <h2>Creează Cont</h2>

        {/* Folosim același formular ca la login */}
        <form onSubmit={handleSubmit} className="login-form">

          {/* Afișăm erorile sau mesajul de succes */}
          {error && <p className="error-mesaj">{error}</p>}
          {success && <p className="success-mesaj">{success}</p>}

          <div className="form-grup">
            <label htmlFor="nume">Nume:</label>
            <input 
              type="text" 
              id="nume"
              value={nume}
              onChange={(e) => setNume(e.target.value)}
              required 
            />
          </div>

          <div className="form-grup">
            <label htmlFor="prenume">Prenume:</label>
            <input 
              type="text" 
              id="prenume"
              value={prenume}
              onChange={(e) => setPrenume(e.target.value)}
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
            />
          </div>

          {/* Dezactivăm butonul dacă a avut succes, ca să nu trimită de 2 ori */}
          <button type="submit" className="login-button" disabled={!!success}>
            Creează Cont
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