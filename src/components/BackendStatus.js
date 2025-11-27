// src/components/BackendStatus.js
import React, { useState, useEffect } from 'react';
import { parkingApi } from '../utils/apiClient';
import './BackendStatus.css';

const BackendStatus = () => {
  const [status, setStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [lastCheck, setLastCheck] = useState(null);

  const checkBackendStatus = async () => {
    setStatus('checking');
    try {
      await parkingApi.checkHealth();
      setStatus('online');
    } catch (error) {
      setStatus('offline');
      console.error('Backend is offline:', error.message);
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'offline':
        return '🔴';
      case 'checking':
      default:
        return '🟡';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Backend Conectat';
      case 'offline':
        return 'Backend Deconectat';
      case 'checking':
      default:
        return 'Verificare...';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'online':
        return 'Serverul rulează normal pe port 3000';
      case 'offline':
        return 'Nu se poate conecta la server. Verificați dacă backend-ul rulează pe http://localhost:3000';
      case 'checking':
      default:
        return 'Se verifică conexiunea...';
    }
  };

  if (status === 'online') {
    return null; // Nu afișăm nimic dacă totul e OK
  }

  return (
    <div className={`backend-status ${status}`}>
      <div className="status-header">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
        <button className="retry-button" onClick={checkBackendStatus}>
          ↻ Reîncearcă
        </button>
      </div>
      <div className="status-message">
        {getStatusMessage()}
        {lastCheck && (
          <div className="last-check">
            Ultima verificare: {lastCheck.toLocaleTimeString('ro-RO')}
          </div>
        )}
      </div>
      
      {status === 'offline' && (
        <div className="troubleshooting">
          <h4>🛠 Pași pentru rezolvare:</h4>
          <ol>
            <li>Verificați dacă backend-ul rulează: <code>npm start</code> în directorul backend</li>
            <li>Backend-ul trebuie să ruleze pe portul 3000</li>
            <li>Verificați endpoint-ul: <a href="http://localhost:3000/api/health" target="_blank" rel="noreferrer">http://localhost:3000/api/health</a></li>
            <li>Verificați logs-urile în console pentru alte erori</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default BackendStatus;