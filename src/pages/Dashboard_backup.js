// src/pages/Dashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { parkingApi } from '../utils/apiClient';
import '../App.css';
import LocuriGrid from '../LocuriGrid.js';

function Dashboard() {

    const [parcareData, setParcareData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [vehicule, setVehicule] = useState([]);
    const [numarNou, setNumarNou] = useState('');
    const [marcaNoua, setMarcaNoua] = useState('');
    const [modelNou, setModelNou] = useState('');
    const [errorVehicul, setErrorVehicul] = useState('');
    const [tarife, setTarife] = useState([]);
    const [abonamente, setAbonamente] = useState([]);
    const [errorAbonament, setErrorAbonament] = useState('');

    const { user, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    // --- MODIFICARE: Definim vehiculul principal aici ---
    // Îl vom folosi și la "Magazin" și îl vom trimite la "LocuriGrid"
    const vehiculPrincipal = vehicule.length > 0 ? vehicule[0] : null;

    // --- Funcția 1: Preluare Parcare Completă ---
    const fetchParcareCompleta = useCallback(async () => {
        setLoading(true);
        try {
            const data = await parkingApi.getParcareCompleta(1);
            setParcareData(data);
        } catch (error) {
            console.error('Eroare la preluarea datelor complete:', error);
            // Nu afișam toast aici pentru a evita spam-ul
        }
        setLoading(false);
    }, []); // Eliminăm toast din dependencies

    // --- Funcția 2: Preluare Vehicule ---
    const fetchVehicule = useCallback(async (idUtilizator) => {
        try {
            const response = await fetch(`http://localhost:3000/api/user/${idUtilizator}/vehicule`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Eroare la preluare vehicule');
            setVehicule(data);
        } catch (error) {
            setErrorVehicul(error.message);
        }
    }, []);

    // --- Funcția 3: Preluare Abonamente (Istoric) ---
    const fetchAbonamente = useCallback(async (idUtilizator) => {
        try {
            const response = await fetch(`http://localhost:3000/api/user/${idUtilizator}/abonamente`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Eroare la preluare abonamente');
            setAbonamente(data);
        } catch (error) {
            setErrorAbonament(error.message);
        }
    }, []);

    // --- Funcția 4: Preluare Tarife (Vitrina) ---
    const fetchTarife = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3000/api/tarife/abonamente');
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Eroare la preluare tarife');
            setTarife(data);
        } catch (error) {
            setErrorAbonament(error.message);
        }
    }, []);

    // --- useEffect Principal: Rulează la încărcarea paginii ---
    useEffect(() => {
        let isMounted = true;
        
        const initializeData = async () => {
            if (user && user.idUtilizator && isMounted) {
                await fetchParcareCompleta();
                await fetchVehicule(user.idUtilizator);
                await fetchAbonamente(user.idUtilizator);
                await fetchTarife();
                
                // Afișăm toast doar la prima încărcare
                if (isMounted) {
                    toast.success('Datele au fost încărcate cu succes!');
                }
            }
        };
        
        initializeData();
        
        return () => {
            isMounted = false;
        };
    }, [user?.idUtilizator]); // Folosim doar ID-ul user-ului ca dependency


    // ========================================================
    // === FUNCȚII DE ACȚIUNE (HANDLERE) ===
    // ========================================================

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAddVehicul = async (e) => {
        e.preventDefault();
        setErrorVehicul('');
        try {
            const response = await fetch('http://localhost:3000/api/user/vehicule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idUtilizator: user.idUtilizator,
                    numarInmatriculare: numarNou,
                    marca: marcaNoua,
                    model: modelNou
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Eroare la adăugare');
            setNumarNou('');
            setMarcaNoua('');
            setModelNou('');
            fetchVehicule(user.idUtilizator);
            toast.success('Vehicul adăugat cu succes!');
        } catch (error) {
            setErrorVehicul(error.message);
        }
    };

    const handleBuyAbonament = async (idTarif) => {
        setErrorAbonament('');
        // --- MODIFICARE: Folosim noua variabilă ---
        if (!vehiculPrincipal) {
            setErrorAbonament('Trebuie să adaugi un vehicul înainte de a cumpăra un abonament.');
            return;
        }
        // --- MODIFICARE: Folosim noua variabilă ---
        const idVehiculPrincipal = vehiculPrincipal.ID_VEHICUL;

        try {
            const response = await fetch('http://localhost:3000/api/user/abonamente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idUtilizator: user.idUtilizator,
                    idVehicul: idVehiculPrincipal,
                    idTarif: idTarif
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Eroare la cumpărare');
            toast.success('Abonament cumpărat cu succes!');
            fetchAbonamente(user.idUtilizator);
        } catch (error) {
            setErrorAbonament(error.message);
        }
    };

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('ro-RO', options);
    };

    // Handler pentru refresh manual
    const handleRefresh = async () => {
        await fetchParcareCompleta();
        toast.success('Datele parcării au fost actualizate!');
    };

    // ========================================================
    // === AFIȘAREA (HTML/JSX) ===
    // ========================================================
    return (
        <div className="App">
            <header className="App-header">
                <div className="header-container">
                    <h1>{parcareData ? parcareData.parcare.NUMEPARCARE : 'Parcare Inteligentă'}</h1>
                    <div className="user-info">
                        <span>Bun venit, {user?.NUME || 'Utilizator'}!</span>
                        <button onClick={() => navigate('/admin')} className="admin-button">Admin</button>
                        <button onClick={handleLogout} className="logout-button">Logout</button>
                    </div>
                </div>
            </header>

            <div className="container">

                {/* === SECȚIUNEA 1: ZONE ȘI LOCURI === */}
                <h2>Zone Disponibile</h2>
                {loading ? (
                    <LoadingSpinner size="large" text="Se încarcă zonele și locurile..." />
                ) : (
                    parcareData && parcareData.zone.map(zona => (
                        <div key={zona.ID_ZONA} className="zona-container">
                            <h3>{zona.NUMEZONA} (Tip: {zona.TIPZONA})</h3>
                            <LocuriGrid
                                locuri={zona.locuri}
                                onRefresh={handleRefresh}
                                // --- MODIFICARE: Trimitem mașina principală ca "prop" ---
                                vehiculPrincipal={vehiculPrincipal}
                            />
                        </div>
                    ))
                )}

                {/* === SECȚIUNEA 2: MAȘINILE MELE === */}
                <div className="vehicule-container">
                    <h2>Mașinile Mele</h2>
                    <form onSubmit={handleAddVehicul} className="vehicul-form">
                        <h3>Adaugă un vehicul nou</h3>
                        {errorVehicul && <p className="error-mesaj">{errorVehicul}</p>}
                        <div className="form-grup-inline">
                            <input type="text" value={numarNou} onChange={(e) => setNumarNou(e.target.value.toUpperCase())} placeholder="Număr (B-123-XYZ)" required />
                            <input type="text" value={marcaNoua} onChange={(e) => setMarcaNoua(e.target.value)} placeholder="Marcă (Dacia)" />
                            <input type="text" value={modelNou} onChange={(e) => setModelNou(e.target.value)} placeholder="Model (Logan)" />
                            <button type="submit" className="login-button add-button">Adaugă</button>
                        </div>
                    </form>

                    <h4>Vehiculele tale înregistrate:</h4>
                    {vehicule.length === 0 ? (
                        <p>Nu ai niciun vehicul adăugat.</p>
                    ) : (
                        <ul className="vehicul-lista">
                            {vehicule.map(v => (
                                <li key={v.ID_VEHICUL}>
                                    <strong>{v.NUMARINMATRICULARE}</strong>
                                    <span>{v.MARCA} {v.MODEL}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* === SECȚIUNEA 3: ABONAMENTE === */}
                <div className="abonamente-container">
                    <h2>Magazin Abonamente</h2>
                    {errorAbonament && <p className="error-mesaj">{errorAbonament}</p>}
                    <div className="tarife-lista">
                        {tarife.map(tarif => (
                            <div key={tarif.ID_TARIF} className="tarif-card">
                                <h3>{tarif.DESCRIERE}</h3>
                                <p className="tarif-zona">Pentru: {tarif.NUMEZONA}</p>
                                <p className="tarif-pret">{tarif.VALOARE} {tarif.MONEDA} / lună</p>
                                <button onClick={() => handleBuyAbonament(tarif.ID_TARIF)} className="login-button buy-button">
                                    Cumpără Acum
                                </button>
                                <span className="buy-info">
                  {/* --- MODIFICARE: Folosim noua variabilă --- */}
                                    (Se va aplica vehiculului: {vehiculPrincipal?.NUMARINMATRICULARE || 'N/A'})
                </span>
                            </div>
                        ))}
                    </div>

                    <h4>Abonamentele tale active:</h4>
                    {abonamente.length === 0 ? (
                        <p>Nu ai niciun abonament activ.</p>
                    ) : (
                        <ul className="vehicul-lista abonament-lista">
                            {abonamente.map(ab => (
                                <li key={ab.ID_ABONAMENT}>
                                    <div>
                                        <strong>{ab.NUMARINMATRICULARE}</strong>
                                        <span>Abonament: {ab.NUMEZONA}</span>
                                    </div>
                                    <div>
                                        <span>Valabil de la: {formatDate(ab.DATASTARTVALABILITATE)}</span>
                                        <span>Până la: {formatDate(ab.DATAEXPIRARE)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>
        </div>
    );
}

export default Dashboard;
