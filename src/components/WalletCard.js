import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { parkingApi } from '../utils/apiClient';
import '../App.css'; // Folosim stilurile globale

const WalletCard = ({ userId, balance, onBalanceChange }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [amount, setAmount] = useState('');
    const { toast } = useToast();

    const handleTopUp = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return;

        try {
            await parkingApi.topUpWallet({
                idUtilizator: userId,
                suma: parseInt(amount)
            });
            
            toast.success(`Ai adăugat ${amount} RON în portofel!`);
            setAmount('');
            setIsAdding(false);
            onBalanceChange(); // Reîmprospătăm balanța în dashboard
        } catch (error) {
            toast.error('Eroare la alimentare: ' + error.message);
        }
    };

    return (
        <div className="wallet-card" style={{
            background: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '16px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '150px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <h3 style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem', textTransform: 'uppercase' }}>Portofel Digital</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0' }}>
                        {balance !== null ? balance : '...'} <span style={{ fontSize: '1rem' }}>RON</span>
                    </div>
                </div>
                <div style={{ fontSize: '2rem' }}>💳</div>
            </div>

            {!isAdding ? (
                <button 
                    onClick={() => setIsAdding(true)}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        alignSelf: 'flex-start',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    + Adaugă Bani
                </button>
            ) : (
                <form onSubmit={handleTopUp} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Suma (RON)"
                        style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            width: '100px'
                        }}
                        autoFocus
                    />
                    <button type="submit" style={{ background: '#27ae60', border: 'none', borderRadius: '6px', color:'white', padding:'0 12px', cursor:'pointer' }}>✓</button>
                    <button type="button" onClick={() => setIsAdding(false)} style={{ background: '#c0392b', border: 'none', borderRadius: '6px', color:'white', padding:'0 12px', cursor:'pointer' }}>✕</button>
                </form>
            )}
        </div>
    );
};

export default WalletCard;